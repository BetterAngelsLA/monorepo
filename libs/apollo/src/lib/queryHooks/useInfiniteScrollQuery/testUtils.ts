import {
  ApolloClient,
  ErrorLike,
  HttpLink,
  InMemoryCache,
  NetworkStatus,
} from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import React = require('react');

/**
 * Minimal useQuery result shape for mocking in tests.
 * We avoid importing Apollo's internal types to keep v4-compatible.
 */
export interface MockUseQueryResult<TData, TVars> {
  data?: TData;
  loading: boolean;
  networkStatus: NetworkStatus;
  error?: ErrorLike;
  called: boolean;
  client: unknown;
  variables?: TVars;

  // methods the hook under test calls
  refetch: (vars?: Partial<TVars>) => Promise<{ data?: TData }>;
  fetchMore: (opts: {
    variables?: Partial<TVars>;
  }) => Promise<{ data?: TData }>;

  // unused but present on real objects
  startPolling: (interval: number) => void;
  stopPolling: () => void;
  updateQuery: unknown;
  subscribeToMore: unknown;
  observable: unknown;

  // optional internal used by Apollo; keep harmless
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Build a mock value that looks like useQuery’s return object.
 * `refetch` and `fetchMore` are Promise-based by default.
 */
export function createUseQueryReturn<TData, TVars>(
  partial: Partial<MockUseQueryResult<TData, TVars>>
): MockUseQueryResult<TData, TVars> {
  const refetch =
    partial.refetch ?? vi.fn().mockResolvedValue({ data: partial.data });

  const fetchMore =
    partial.fetchMore ?? vi.fn().mockResolvedValue({ data: partial.data });

  const result: MockUseQueryResult<TData, TVars> = {
    data: undefined,
    loading: false,
    networkStatus: NetworkStatus.ready,
    error: undefined,
    called: true,
    client: {},
    variables: (partial.variables as TVars) ?? ({} as TVars),

    refetch,
    fetchMore,

    startPolling: vi.fn(),
    stopPolling: vi.fn(),
    updateQuery: vi.fn(),
    subscribeToMore: vi.fn(),
    observable: {},

    ...partial,
  };

  // Ensure the promise-based implementations remain
  result.refetch = refetch;
  result.fetchMore = fetchMore;

  // Some Apollo internals reference this; keep it as a resolved promise
  result['reobserve'] = vi.fn().mockResolvedValue(undefined);

  return result;
}

export function createTestApolloClient() {
  const cache = new InMemoryCache();
  const link = new HttpLink({ uri: '/graphql' });

  return new ApolloClient({ cache, link });
}

export function renderHookWithApollo<T>(callback: () => T) {
  const client = createTestApolloClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(ApolloProvider as any, { client }, children);

  return renderHook(callback, { wrapper: Wrapper });
}
