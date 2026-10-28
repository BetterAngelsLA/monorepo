import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from '@apollo/client';
import { ApolloProvider, useApolloClient } from '@apollo/client/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { AuditEventKind, AuditTargetType } from '@monorepo/ba-platform/types';
import { fireEvent, render, screen } from '@testing-library/react';
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

function page(
  variables: Record<string, unknown>,
  results: Array<Record<string, unknown>>,
  endCursor: string | null,
  hasNextPage: boolean,
) {
  return {
    request: { query: ObjectAuditLogDocument, variables },
    result: {
      data: {
        objectAuditLog: {
          __typename: 'AuditActionPage',
          endCursor,
          hasNextPage,
          results,
        },
      },
    },
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

/** A client whose first request succeeds and whose later requests fail. */
function makeClientThatFailsOnRefresh() {
  let calls = 0;
  const link = new ApolloLink(
    () =>
      new Observable((observer) => {
        calls += 1;
        if (calls === 1) {
          observer.next({
            data: {
              objectAuditLog: {
                __typename: 'AuditActionPage',
                endCursor: null,
                hasNextPage: false,
                results: [makeAction()],
              },
            },
          });
          observer.complete();
          return;
        }

        observer.error(new Error('network down'));
      }),
  );

  return new ApolloClient({ link, cache: new InMemoryCache() });
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

  it('keeps cached actions when a refresh fails and offers a retry', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    render(
      <ApolloProvider client={makeClientThatFailsOnRefresh()}>
        <ObjectAuditLog targetType={AuditTargetType.Bed} objectId="7" />
        <RefreshTrigger />
      </ApolloProvider>,
    );

    await screen.findByText('Ada Lovelace');
    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));

    expect(
      await screen.findByText('Couldn\u2019t refresh activity.'),
    ).not.toBeNull();
    // The cached action must survive the failed refresh.
    expect(screen.getByText('Ada Lovelace')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Retry' })).not.toBeNull();

    consoleError.mockRestore();
  });
});
