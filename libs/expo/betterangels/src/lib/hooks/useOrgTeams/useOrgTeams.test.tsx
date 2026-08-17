import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ActiveOrgProvider } from '@monorepo/ba-platform';
import type { StorageAdapter } from '@monorepo/react/shared';
import { renderHook, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { useOrgTeams } from './useOrgTeams';

/**
 * Teams are org-scoped and the server requires the X-Organization-ID header
 * rather than guessing, so the query must not fire before ActiveOrgProvider has
 * selected an org.
 *
 * These assert on whether a request was *issued* — counted at the link — rather
 * than on loading flags, which look identical for "skipped" and "in flight" on
 * the first render.
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

function inMemoryStorage(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  };
}

function setup(organizations: (typeof ORG)[]) {
  const issued: string[] = [];

  const link = new ApolloLink((operation) => {
    issued.push(operation.operationName);
    return new Observable((observer) => {
      observer.next(TEAMS_RESULT);
      observer.complete();
    });
  });

  const client = new ApolloClient({ link, cache: new InMemoryCache() });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ApolloProvider client={client}>
        <ActiveOrgProvider
          organizations={organizations}
          storage={inMemoryStorage()}
        >
          {children}
        </ActiveOrgProvider>
      </ApolloProvider>
    );
  }

  const rendered = renderHook(() => useOrgTeams(), { wrapper: Wrapper });
  return { ...rendered, issued };
}

describe('useOrgTeams', () => {
  it('issues no request while there is no active org', async () => {
    const { result, issued } = setup([]);

    // Give a request every chance to be issued and settle.
    await waitFor(() => expect(result.current.teams).toEqual([]));

    expect(issued).toEqual([]);
  });

  it('reports loading rather than "no teams" while waiting for the org', async () => {
    const { result } = setup([]);

    await waitFor(() => expect(result.current.teams).toEqual([]));

    // Callers keep showing a spinner instead of rendering an empty list as final.
    expect(result.current.loading).toBe(true);
  });

  it('issues the request once an active org is available', async () => {
    const { result, issued } = setup([ORG]);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(issued).toEqual(['Teams']);
    expect(result.current.teams).toHaveLength(1);
    expect(result.current.teams[0]?.name).toBe('WDI On-site');
    expect(result.current.totalCount).toBe(1);
  });
});
