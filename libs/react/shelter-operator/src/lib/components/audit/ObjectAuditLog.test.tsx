import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from '@apollo/client';
import { ApolloProvider, useApolloClient } from '@apollo/client/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { AuditEventKind, AuditTargetType } from '@monorepo/ba-platform/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ObjectAuditLog } from './ObjectAuditLog';
import { ObjectAuditLogDocument } from '../../hooks/useObjectAuditLog/__generated__/useObjectAuditLog.generated';

const baseVariables = {
  targetType: AuditTargetType.Bed,
  objectId: '7',
  limit: 25,
};

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    __typename: 'AuditEventType',
    timestamp: '2026-07-01T12:00:00Z',
    kind: AuditEventKind.Update,
    action: 'bed.update',
    summary: null,
    context: null,
    fieldChanges: { name: ['Bed A', 'Bed B'] },
    ...overrides,
  };
}

function makeAction(overrides: Record<string, unknown> = {}) {
  return {
    __typename: 'AuditActionType',
    timestamp: '2026-07-01T12:00:00Z',
    actor: 'Ada Lovelace',
    truncated: false,
    fieldChanges: { name: ['Bed A', 'Bed B'] },
    events: [makeEvent()],
    ...overrides,
  };
}

function pageData(
  results: Array<Record<string, unknown>>,
  endCursor: string | null,
  hasNextPage: boolean,
) {
  return {
    objectAuditLog: {
      __typename: 'AuditActionPage',
      endCursor,
      hasNextPage,
      results,
    },
  };
}

function page(
  variables: Record<string, unknown>,
  results: Array<Record<string, unknown>>,
  endCursor: string | null,
  hasNextPage: boolean,
) {
  return {
    request: { query: ObjectAuditLogDocument, variables },
    result: { data: pageData(results, endCursor, hasNextPage) },
  };
}

function errorPage(variables: Record<string, unknown>) {
  return {
    request: { query: ObjectAuditLogDocument, variables },
    error: new Error('network down'),
  };
}

function renderLog(mocks: ReadonlyArray<unknown>) {
  return render(
    <MockedProvider mocks={mocks as never} showWarnings={false}>
      <ObjectAuditLog targetType={AuditTargetType.Bed} objectId="7" />
    </MockedProvider>,
  );
}

type ResponsePhase = 'initial' | 'failing' | 'reloaded';

/**
 * Responses are phase-controlled so a test can prove that Retry issued a request:
 * the "reloaded" payload is distinguishable from the initial one, and a retry
 * that only cleared the error banner could never produce it.
 */
function makeClientThatFailsOnRefresh() {
  let phase: ResponsePhase = 'initial';
  const link = new ApolloLink(
    () =>
      new Observable((observer) => {
        if (phase === 'failing') {
          observer.error(new Error('network down'));
          return;
        }

        const actor =
          phase === 'reloaded' ? 'Ada Lovelace (reloaded)' : 'Ada Lovelace';

        observer.next({ data: pageData([makeAction({ actor })], null, false) });
        observer.complete();
      }),
  );

  return {
    client: new ApolloClient({ link, cache: new InMemoryCache() }),
    setPhase: (next: ResponsePhase) => {
      phase = next;
    },
  };
}

/** Page one, page two, a failed refresh, then a retry that replays both pages. */
function makePagedClientThatFailsOnRefresh() {
  let phase: ResponsePhase = 'initial';
  const link = new ApolloLink(
    (operation) =>
      new Observable((observer) => {
        if (phase === 'failing') {
          observer.error(new Error('network down'));
          return;
        }

        const reloaded = phase === 'reloaded';
        const actor = reloaded ? 'Ada Lovelace (reloaded)' : 'Ada Lovelace';
        const after = operation.variables.after as string | undefined;

        if (!after) {
          observer.next({
            data: pageData([makeAction({ actor })], 'c1', true),
          });
          observer.complete();
          return;
        }

        if (after === 'c1') {
          observer.next({
            data: pageData(
              [
                makeAction({
                  actor,
                  fieldChanges: {
                    name: ['Bed A', reloaded ? 'PAGE2 (replayed)' : 'PAGE2'],
                  },
                }),
              ],
              null,
              false,
            ),
          });
          observer.complete();
          return;
        }

        observer.error(new Error(`unexpected cursor ${after}`));
      }),
  );

  return {
    client: new ApolloClient({ link, cache: new InMemoryCache() }),
    setPhase: (next: ResponsePhase) => {
      phase = next;
    },
  };
}

function RefreshTrigger() {
  const client = useApolloClient();

  return (
    <button
      type="button"
      onClick={() => {
        void client
          .refetchQueries({ include: 'active' })
          .catch(() => undefined);
      }}
    >
      refresh
    </button>
  );
}

describe('ObjectAuditLog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders grouped actions with their field changes', async () => {
    renderLog([page(baseVariables, [makeAction()], null, false)]);

    expect(await screen.findByText('Ada Lovelace')).not.toBeNull();
    expect(screen.getByText('Name:')).not.toBeNull();
    expect(screen.getByText('Bed B')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /load more/i })).toBeNull();
  });

  it('shows the empty state when there are no actions', async () => {
    renderLog([page(baseVariables, [], null, false)]);

    await screen.findByText('No activity yet.');
  });

  it('appends the next page instead of replacing the first one', async () => {
    renderLog([
      page(baseVariables, [makeAction()], 'c1', true),
      page(
        { ...baseVariables, after: 'c1' },
        [makeAction({ fieldChanges: { name: ['Bed A', 'PAGE2'] } })],
        null,
        false,
      ),
    ]);

    await screen.findByText('Name:');
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));

    expect(await screen.findByText('PAGE2')).not.toBeNull();
    // The first page must still be on screen; replacing it would also show PAGE2.
    expect(screen.getByText('Bed B')).not.toBeNull();
    expect(screen.getAllByText('Name:')).toHaveLength(2);
  });

  it('shows an error with a retry that reloads the log', async () => {
    renderLog([
      errorPage(baseVariables),
      page(baseVariables, [makeAction()], null, false),
    ]);

    expect(await screen.findByText('Unable to load activity.')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Ada Lovelace')).not.toBeNull();
  });

  it('keeps cached actions when a refresh fails, then recovers on retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recorded = makeClientThatFailsOnRefresh();

    render(
      <ApolloProvider client={recorded.client}>
        <ObjectAuditLog targetType={AuditTargetType.Bed} objectId="7" />
        <RefreshTrigger />
      </ApolloProvider>,
    );

    await screen.findByText('Ada Lovelace');
    recorded.setPhase('failing');
    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));

    expect(
      await screen.findByText('Couldn\u2019t refresh activity.'),
    ).not.toBeNull();
    // The cached action must survive the failed refresh.
    expect(screen.getByText('Ada Lovelace')).not.toBeNull();

    recorded.setPhase('reloaded');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() =>
      expect(screen.queryByText('Couldn\u2019t refresh activity.')).toBeNull(),
    );
    // Retry must re-issue the request: the reloaded payload cannot come from
    // merely clearing the error banner.
    expect(await screen.findByText('Ada Lovelace (reloaded)')).not.toBeNull();
  });

  it('replays loaded pages when retrying a failed refresh', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recorded = makePagedClientThatFailsOnRefresh();

    render(
      <ApolloProvider client={recorded.client}>
        <ObjectAuditLog targetType={AuditTargetType.Bed} objectId="7" />
        <RefreshTrigger />
      </ApolloProvider>,
    );

    await screen.findByText('Bed B');
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));
    expect(await screen.findByText('PAGE2')).not.toBeNull();

    recorded.setPhase('failing');
    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));
    expect(
      await screen.findByText('Couldn\u2019t refresh activity.'),
    ).not.toBeNull();

    recorded.setPhase('reloaded');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() =>
      expect(screen.queryByText('Couldn\u2019t refresh activity.')).toBeNull(),
    );
    // Retry re-fetches page one and replays the saved page cursor; both are
    // proved by payloads that only exist after Retry.
    expect(await screen.findByText('Ada Lovelace (reloaded)')).not.toBeNull();
    expect(await screen.findByText('PAGE2 (replayed)')).not.toBeNull();
    expect(screen.getByText('Bed B')).not.toBeNull();
    expect(screen.getAllByText('Name:')).toHaveLength(2);
  });
});
