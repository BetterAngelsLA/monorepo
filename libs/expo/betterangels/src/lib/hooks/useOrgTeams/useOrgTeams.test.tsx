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
  type ActiveOrgPersistence,
} from '@monorepo/ba-platform';
import { renderHook, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useOrgTeams } from './useOrgTeams';

/**
 * Asserts which org each request names in its ``filters.organizationId``,
 * counted at the link, rather than inferred from loading flags, which cannot
 * distinguish a request that never went out from one still in flight.
 *
 * ``useOrgTeams`` stands in for any org-scoped query: the org now travels in
 * the operation's variables, read from the same active-org store the (retired)
 * header interceptor used to read.
 */

const ORG = { id: 'org-1', name: 'Test Org', permissions: [] as const };

const TEAMS_RESULT = {
  data: {
    teams: {
      __typename: 'TeamTypeOffsetPaginated',
      totalCount: 1,
      results: [
        {
          __typename: 'TeamType',
          id: 'team-1',
          name: 'Team One',
          isActive: true,
        },
      ],
    },
  },
};

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

type RecordedOperation = {
  organizationId: string | null | undefined;
  storeOrgId: string | null;
};

/** Records the org each operation names and what the store held at the time. */
function createRecordingClient() {
  const operations: RecordedOperation[] = [];
  const link = new ApolloLink(
    (operation) =>
      new Observable((observer) => {
        const filters = operation.variables?.filters as
          | { organizationId?: string | null }
          | undefined;
        operations.push({
          organizationId: filters?.organizationId,
          storeOrgId: getActiveOrgId(),
        });
        observer.next(TEAMS_RESULT as never);
        observer.complete();
      }),
  );
  return {
    operations,
    client: new ApolloClient({ link, cache: new InMemoryCache() }),
  };
}

describe('useOrgTeams', () => {
  // So a test that doesn't install its own storage still starts empty.
  beforeEach(() => configureActiveOrgStorage(createSyncStorage()));

  function renderWith(organizations: readonly (typeof ORG)[]) {
    const { client, operations } = createRecordingClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApolloProvider client={client}>
        <ActiveOrgProvider organizations={[...organizations]}>
          {children}
        </ActiveOrgProvider>
      </ApolloProvider>
    );
    return {
      ...renderHook(() => useOrgTeams(), { wrapper }),
      operations,
    };
  }

  it('every request it issues names the active org', async () => {
    configureActiveOrgStorage(createSyncStorage());

    const { result, operations } = renderWith([ORG]);

    await waitFor(() => expect(result.current.teams).toHaveLength(1));
    expect(operations.length).toBeGreaterThan(0);
    expect(operations.every((op) => op.organizationId === 'org-1')).toBe(true);
    // The request names the same org the store held when it went out.
    expect(operations.every((op) => op.organizationId === op.storeOrgId)).toBe(
      true,
    );
  });

  it('uses the remembered organization, not the first one', async () => {
    const other = { ...ORG, id: 'org-2', name: 'Other Org' };
    configureActiveOrgStorage(createSyncStorage('org-2'));

    const { result, operations } = renderWith([ORG, other]);

    await waitFor(() => expect(result.current.teams).toHaveLength(1));
    expect(operations.length).toBeGreaterThan(0);
    expect(operations.every((op) => op.organizationId === 'org-2')).toBe(true);
  });

  it('queries with the remembered org before the org list has loaded', async () => {
    // UserProvider renders children with organizations={[]} while the user
    // query resolves. The store already holds the remembered organization, so
    // the request carries it anyway.
    configureActiveOrgStorage(createSyncStorage('org-1'));

    const { operations } = renderWith([]);

    await waitFor(() => expect(operations.length).toBeGreaterThan(0));
    expect(operations.every((op) => op.organizationId === 'org-1')).toBe(true);
  });

  it('does not query while no org is active', async () => {
    configureActiveOrgStorage(createSyncStorage());

    const { result, operations } = renderWith([]);

    // Nothing to scope the read to — the hook stays idle instead of issuing a
    // request the backend would deny.
    expect(result.current.teams).toHaveLength(0);
    expect(result.current.loading).toBe(false);
    await waitFor(() => expect(getActiveOrgId()).toBeNull());
    expect(operations).toHaveLength(0);
  });
});
