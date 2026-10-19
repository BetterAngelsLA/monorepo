import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import {
  ActiveOrgProvider,
  configureActiveOrgStorage,
  getActiveOrgId,
  setActiveOrgId,
  type ActiveOrgPersistence,
} from '@monorepo/ba-platform';
import {
  act,
  render,
  renderHook,
  waitFor,
} from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { beforeEach, describe, expect, it } from 'vitest';

import { useOrgTeams } from './useOrgTeams';

/**
 * Asserts which org each request names and what the active-org store held when
 * it went out. Counted at the link: a request that never went out is otherwise
 * indistinguishable from one still in flight.
 *
 * ``useOrgTeams`` stands in for any org-scoped query.
 */

type TestOrg = {
  id: string;
  name: string;
  permissions: readonly string[];
};

type RecordedOperation = {
  organizationId: string | null | undefined;
  storeOrgId: string | null;
};

type Snapshot = {
  teams: string[];
  isIdle: boolean;
  loading: boolean;
  error?: string;
};

const ORG: TestOrg = { id: 'org-1', name: 'Org One', permissions: [] };
const OTHER: TestOrg = { id: 'org-2', name: 'Org Two', permissions: [] };

function createSyncStorage(
  initial: string | null = null,
): ActiveOrgPersistence {
  let value = initial;
  return {
    get: () => value,
    set: (next) => {
      value = next;
    },
  };
}

/** A team per org, so a stale variable is visible in the result, not just the link. */
function teamsResult(orgId: string | null | undefined) {
  return {
    data: {
      teams: {
        __typename: 'TeamTypeOffsetPaginated',
        totalCount: 1,
        results: [
          {
            __typename: 'TeamType',
            id: `team-${orgId}`,
            name: `Team ${orgId}`,
            isActive: true,
          },
        ],
      },
    },
  };
}

type ClientOptions = {
  delayMs?: number;
  /** Refuse this org the way the backend does for one the user does not belong to. */
  deny?: (organizationId: string) => boolean;
};

/** Records the org each operation names and what the store held at the time. */
function createClient({ delayMs = 0, deny }: ClientOptions = {}) {
  const operations: RecordedOperation[] = [];
  const link = new ApolloLink(
    (operation) =>
      new Observable((observer) => {
        const filters = operation.variables?.filters as
          | { organizationId?: string | null }
          | undefined;
        const organizationId = filters?.organizationId;
        operations.push({ organizationId, storeOrgId: getActiveOrgId() });

        if (organizationId && deny?.(organizationId)) {
          observer.error(
            new Error('You do not have access to this organization.'),
          );
          return;
        }

        const emit = () => {
          observer.next(teamsResult(organizationId) as never);
          observer.complete();
        };
        if (delayMs) setTimeout(emit, delayMs);
        else emit();
      }),
  );

  return {
    operations,
    client: new ApolloClient({ link, cache: new InMemoryCache() }),
  };
}

function wrap(
  client: ApolloClient,
  organizations: readonly TestOrg[] | undefined,
) {
  return ({ children }: { children: ReactNode }) => (
    <ApolloProvider client={client}>
      <ActiveOrgProvider
        organizations={organizations ? [...organizations] : undefined}
      >
        {children}
      </ActiveOrgProvider>
    </ApolloProvider>
  );
}

/**
 * A tree whose organization list is a prop, so a test can move from "not known
 * yet" to "known" the way ``UserProvider`` does — by re-rendering it.
 */
function Harness(props: {
  client: ApolloClient;
  organizations: readonly TestOrg[] | undefined;
}) {
  const { client, organizations } = props;

  return (
    <ApolloProvider client={client}>
      <ActiveOrgProvider
        organizations={organizations ? [...organizations] : undefined}
      >
        <Probe />
      </ActiveOrgProvider>
    </ApolloProvider>
  );
}

/** Publishes the hook's state through the tree, not by mutating a prop. */
function Probe() {
  const { teams, isIdle, loading, error } = useOrgTeams();

  return (
    <Text testID="org-teams-probe">
      {JSON.stringify({
        teams: teams.map((team) => team.id),
        isIdle,
        loading,
        error: error?.message,
      } satisfies Snapshot)}
    </Text>
  );
}

function snapshot(view: Awaited<ReturnType<typeof render>>): Snapshot {
  return JSON.parse(
    String(view.getByTestId('org-teams-probe').props.children),
  ) as Snapshot;
}

describe('useOrgTeams', () => {
  // So a test that doesn't install its own storage still starts empty.
  beforeEach(() => configureActiveOrgStorage(createSyncStorage()));

  it('names the active organization on every request it issues', async () => {
    const { operations, client } = createClient();
    const { result } = await renderHook(() => useOrgTeams(), {
      wrapper: wrap(client, [ORG]),
    });

    await waitFor(() => expect(result.current.teams).toHaveLength(1));
    expect(operations.length).toBeGreaterThan(0);
    expect(operations.every((op) => op.organizationId === 'org-1')).toBe(true);
    // The org named is the org the store held when the request went out.
    expect(operations.every((op) => op.organizationId === op.storeOrgId)).toBe(
      true,
    );
    expect(result.current.isIdle).toBe(false);
  });

  it('uses the remembered organization, not the first one', async () => {
    configureActiveOrgStorage(createSyncStorage('org-2'));
    const { operations, client } = createClient();
    const { result } = await renderHook(() => useOrgTeams(), {
      wrapper: wrap(client, [ORG, OTHER]),
    });

    await waitFor(() => expect(result.current.teams).toHaveLength(1));
    expect(operations.every((op) => op.organizationId === 'org-2')).toBe(true);
  });

  it('queries with the remembered org before the org list is known', async () => {
    // No provider has installed an organization source yet. The store answers
    // with the remembered id, which is the window in which a screen can
    // already issue its query.
    configureActiveOrgStorage(createSyncStorage('org-1'));
    const { operations, client } = createClient();
    const { result } = await renderHook(() => useOrgTeams(), {
      wrapper: wrap(client, undefined),
    });

    await waitFor(() => expect(operations.length).toBeGreaterThan(0));
    expect(operations.every((op) => op.organizationId === 'org-1')).toBe(true);
    expect(operations.every((op) => op.organizationId === op.storeOrgId)).toBe(
      true,
    );
    expect(result.current.isIdle).toBe(false);
  });

  it('stays idle while no org is active', async () => {
    const { operations, client } = createClient();
    const { result } = await renderHook(() => useOrgTeams(), {
      wrapper: wrap(client, []),
    });

    await waitFor(() => expect(getActiveOrgId()).toBeNull());
    expect(operations).toHaveLength(0);
    expect(result.current.teams).toHaveLength(0);
    expect(result.current.isIdle).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('queries once when the org list arrives after mount', async () => {
    const { operations, client } = createClient();
    const view = await render(
      <Harness client={client} organizations={undefined} />,
    );

    expect(operations).toHaveLength(0);
    expect(snapshot(view).isIdle).toBe(true);

    await act(async () => {
      await view.rerender(<Harness client={client} organizations={[ORG]} />);
    });

    await waitFor(() => expect(operations).toHaveLength(1));
    expect(operations[0].organizationId).toBe('org-1');
    expect(snapshot(view).isIdle).toBe(false);
    await waitFor(() => expect(snapshot(view).teams).toEqual(['team-org-1']));
  });

  it('re-queries the newly active org and drops the old org', async () => {
    const { operations, client } = createClient({ delayMs: 20 });
    const { result } = await renderHook(() => useOrgTeams(), {
      wrapper: wrap(client, [ORG, OTHER]),
    });

    await waitFor(() =>
      expect(result.current.teams.map((team) => team.id)).toEqual([
        'team-org-1',
      ]),
    );

    await act(async () => {
      setActiveOrgId('org-2');
    });

    await waitFor(() =>
      expect(result.current.teams.map((team) => team.id)).toEqual([
        'team-org-2',
      ]),
    );
    expect(operations.map((op) => op.organizationId)).toEqual([
      'org-1',
      'org-2',
    ]);
  });

  it('surfaces a denied remembered org, then recovers when the list resolves', async () => {
    configureActiveOrgStorage(createSyncStorage('org-9'));
    const { operations, client } = createClient({
      deny: (organizationId) => organizationId === 'org-9',
    });
    const view = await render(
      <Harness client={client} organizations={undefined} />,
    );

    await waitFor(() =>
      expect(snapshot(view).error).toBe(
        'You do not have access to this organization.',
      ),
    );
    expect(operations.map((op) => op.organizationId)).toEqual(['org-9']);

    await act(async () => {
      await view.rerender(<Harness client={client} organizations={[ORG]} />);
    });

    await waitFor(() => expect(snapshot(view).teams).toEqual(['team-org-1']));
    expect(snapshot(view).error).toBeUndefined();
    expect(operations.map((op) => op.organizationId)).toEqual([
      'org-9',
      'org-1',
    ]);
  });
});
