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
  resetActiveOrgStoreForTests,
  type SyncOrgStorage,
} from '@monorepo/ba-platform';
import { renderHook, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useOrgTeams } from './useOrgTeams';

/**
 * Teams are org-scoped and the server requires the ``X-Organization-ID`` header
 * rather than guessing, so a request must never be issued without one.
 *
 * The hook has no readiness gate — it does not need one. The active org id is
 * published to a synchronously-written store before React renders, so by the
 * time this query runs the interceptor already has a header to attach. These
 * tests pin that: they assert what the *store* holds at the moment a request is
 * issued, counted at the link rather than inferred from loading flags.
 */

const ORG = { id: 'org-1', name: 'Test Org', permissions: [] as const };

const TEAMS_RESULT = {
  data: {
    teams: {
      __typename: 'TeamTypeOffsetPaginated',
      totalCount: 1,
      results: [{ __typename: 'TeamType', id: 'team-1', name: 'WDI On-site' }],
    },
  },
};

function createSyncStorage(initial: string | null = null): SyncOrgStorage {
  let value = initial;
  return {
    get: () => value,
    set: (next) => {
      value = next;
    },
  };
}

/** Records the org id visible to the interceptor for each operation issued. */
function createRecordingClient() {
  const orgIdPerOperation: (string | null)[] = [];
  const link = new ApolloLink(
    () =>
      new Observable((observer) => {
        orgIdPerOperation.push(getActiveOrgId());
        observer.next(TEAMS_RESULT as never);
        observer.complete();
      }),
  );
  return {
    orgIdPerOperation,
    client: new ApolloClient({ link, cache: new InMemoryCache() }),
  };
}

describe('useOrgTeams', () => {
  beforeEach(() => {
    resetActiveOrgStoreForTests();
  });

  function renderWith(organizations: readonly typeof ORG[]) {
    const { client, orgIdPerOperation } = createRecordingClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApolloProvider client={client}>
        <ActiveOrgProvider organizations={[...organizations]}>
          {children}
        </ActiveOrgProvider>
      </ApolloProvider>
    );
    return { ...renderHook(() => useOrgTeams(), { wrapper }), orgIdPerOperation };
  }

  it('every request it issues carries an active org', async () => {
    configureActiveOrgStorage(createSyncStorage());

    const { result, orgIdPerOperation } = renderWith([ORG]);

    await waitFor(() => expect(result.current.teams).toHaveLength(1));
    expect(orgIdPerOperation.length).toBeGreaterThan(0);
    expect(orgIdPerOperation).not.toContain(null);
  });

  it('uses the remembered organization, not the first one', async () => {
    const other = { ...ORG, id: 'org-2', name: 'Other Org' };
    configureActiveOrgStorage(createSyncStorage('org-2'));

    const { result, orgIdPerOperation } = renderWith([ORG, other]);

    await waitFor(() => expect(result.current.teams).toHaveLength(1));
    expect(orgIdPerOperation.every((id) => id === 'org-2')).toBe(true);
  });

  it('issues nothing for a user with no organizations', async () => {
    configureActiveOrgStorage(createSyncStorage());

    const { result, orgIdPerOperation } = renderWith([]);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(orgIdPerOperation).toHaveLength(0);
    expect(result.current.teams).toEqual([]);
  });
});
