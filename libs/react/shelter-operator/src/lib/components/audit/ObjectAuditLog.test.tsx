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
import { useState } from 'react';
import { ObjectAuditLog } from './ObjectAuditLog';
import { useObjectAuditLog } from '../../hooks';
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

type ResponsePhase = 'initial' | 'failing' | 'replay-failing' | 'reloaded';

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

        const reloaded = phase === 'reloaded' || phase === 'replay-failing';
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
          if (phase === 'replay-failing') {
            observer.error(new Error('replay down'));
            return;
          }

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

/** A component that calls `loadMore` twice in one click, bypassing the button. */
function DoubleLoadMore() {
  const { actions, loadMore } = useObjectAuditLog({
    targetType: AuditTargetType.Bed,
    objectId: '7',
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          void loadMore();
          void loadMore();
        }}
      >
        double load
      </button>
      {actions.map((action, index) => (
        <div key={index}>{action.actor}</div>
      ))}
    </div>
  );
}

function SwitchableHarness() {
  const [objectId, setObjectId] = useState('7');
  const { actions, loadMore, retry } = useObjectAuditLog({
    targetType: AuditTargetType.Bed,
    objectId,
  });

  return (
    <>
      {actions.map((action, index) => (
        <div key={index}>{action.actor}</div>
      ))}
      <button type="button" onClick={() => void loadMore()}>
        load more
      </button>
      <button type="button" onClick={() => setObjectId('8')}>
        switch
      </button>
      <button type="button" onClick={() => void retry()}>
        retry
      </button>
    </>
  );
}

function SwitchableLog() {
  const [objectId, setObjectId] = useState('7');

  return (
    <>
      <button type="button" onClick={() => setObjectId('8')}>
        switch
      </button>
      <ObjectAuditLog targetType={AuditTargetType.Bed} objectId={objectId} />
    </>
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

  it('does not start a second load-more while one is in flight', async () => {
    const pageTwo = () =>
      page(
        { ...baseVariables, after: 'c1' },
        [makeAction({ actor: 'PAGE2' })],
        null,
        false,
      );

    render(
      <MockedProvider
        mocks={
          [
            page(baseVariables, [makeAction({ actor: 'PAGE1' })], 'c1', true),
            { ...pageTwo(), delay: 50 },
            { ...pageTwo(), delay: 50 },
          ] as never
        }
        showWarnings={false}
      >
        <DoubleLoadMore />
      </MockedProvider>,
    );

    await screen.findByText('PAGE1');
    fireEvent.click(screen.getByRole('button', { name: 'double load' }));

    expect(await screen.findByText('PAGE2')).not.toBeNull();
    await waitFor(() => expect(screen.getAllByText('PAGE2')).toHaveLength(1));
  });

  it('surfaces a replay failure instead of clearing the refresh error', async () => {
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
      await screen.findByText('Couldn’t refresh activity.'),
    ).not.toBeNull();

    recorded.setPhase('replay-failing');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    // Page one came back, but the replayed page did not. The error must stay
    // visible; clearing it would make a failed retry look successful.
    expect(await screen.findByText('Ada Lovelace (reloaded)')).not.toBeNull();
    expect(screen.getByText('Couldn’t refresh activity.')).not.toBeNull();
    expect(screen.queryByText('PAGE2')).toBeNull();

    // The failed cursor is the cache's end cursor, and the cursor chain was
    // trimmed to the successful prefix, so Load more can retry it.
    recorded.setPhase('reloaded');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('PAGE2 (replayed)')).not.toBeNull();
    await waitFor(() =>
      expect(screen.queryByText('Couldn’t refresh activity.')).toBeNull(),
    );
  });

  it('ignores a page that resolves after the object changes', async () => {
    render(
      <MockedProvider
        mocks={
          [
            page(
              baseVariables,
              [makeAction({ actor: 'OLD OBJECT' })],
              'c1',
              true,
            ),
            {
              ...page(
                { ...baseVariables, after: 'c1' },
                [makeAction({ actor: 'OLD PAGE' })],
                null,
                false,
              ),
              delay: 100,
            },
            page(
              { ...baseVariables, objectId: '8' },
              [makeAction({ actor: 'NEW OBJECT' })],
              null,
              false,
            ),
          ] as never
        }
        showWarnings={false}
      >
        <SwitchableLog />
      </MockedProvider>,
    );

    await screen.findByText('OLD OBJECT');
    fireEvent.click(screen.getByRole('button', { name: /load more/i }));
    fireEvent.click(screen.getByRole('button', { name: 'switch' }));

    expect(await screen.findByText('NEW OBJECT')).not.toBeNull();

    await new Promise((resolve) => setTimeout(resolve, 200));

    // The in-flight page belonged to object 7; it must not be appended to 8.
    expect(screen.queryByText('OLD PAGE')).toBeNull();
  });

  it("does not replay the old object's cursor after a switch", async () => {
    const calls: Array<{ objectId?: string; after?: string }> = [];
    const link = new ApolloLink(
      (operation) =>
        new Observable((observer) => {
          const { objectId, after } = operation.variables as {
            objectId: string;
            after?: string;
          };

          calls.push({ objectId, after });

          if (after === 'c7') {
            if (objectId === '8') {
              observer.error(new Error('stale cursor'));
              return;
            }

            setTimeout(() => {
              observer.next({
                data: pageData(
                  [makeAction({ actor: 'OLD PAGE' })],
                  null,
                  false,
                ),
              });
              observer.complete();
            }, 75);
            return;
          }

          if (!after) {
            observer.next({
              data: pageData(
                [
                  makeAction({
                    actor: objectId === '7' ? 'OBJECT 7' : 'OBJECT 8',
                  }),
                ],
                objectId === '7' ? 'c7' : 'c8',
                true,
              ),
            });
            observer.complete();
            return;
          }

          observer.error(new Error(`unexpected cursor ${after}`));
        }),
    );
    const client = new ApolloClient({ link, cache: new InMemoryCache() });

    render(
      <ApolloProvider client={client}>
        <SwitchableHarness />
      </ApolloProvider>,
    );

    await screen.findByText('OBJECT 7');
    fireEvent.click(screen.getByRole('button', { name: 'load more' }));
    fireEvent.click(screen.getByRole('button', { name: 'switch' }));
    await screen.findByText('OBJECT 8');

    // Let the in-flight page for object 7 resolve after the switch.
    await new Promise((resolve) => setTimeout(resolve, 150));

    calls.length = 0;
    fireEvent.click(screen.getByRole('button', { name: 'retry' }));
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Retry on object 8 must not replay the old object's cursor.
    expect(
      calls.some((call) => call.objectId === '8' && call.after === 'c7'),
    ).toBe(false);
  });
});
