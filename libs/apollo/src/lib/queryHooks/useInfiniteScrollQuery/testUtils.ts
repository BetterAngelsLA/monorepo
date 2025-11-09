import {
  NetworkStatus,
  type ApolloClient,
  type OperationVariables,
  type QueryHookOptions,
  type QueryResult,
} from '@apollo/client';
import { vi } from 'vitest';

/**
 * Create a mock generated Apollo query hook:
 *   (options: QueryHookOptions<D, V>) => QueryResult<D, V>
 *
 * - refetch/fetchMore return Promises, because the hook under test does `.catch(...)`
 * - we build first, then patch, to avoid duplicate keys and to set deprecated fields
 */
export function createQueryHookMock<
  TData,
  TVars extends OperationVariables = OperationVariables
>(
  partial: Partial<QueryResult<TData, TVars>>
): (options: QueryHookOptions<TData, TVars>) => QueryResult<TData, TVars> {
  const hook = vi.fn(
    (options: QueryHookOptions<TData, TVars>): QueryResult<TData, TVars> => {
      // promise-based defaults
      const refetch =
        partial.refetch ?? vi.fn().mockResolvedValue({ data: partial.data });
      const fetchMore =
        partial.fetchMore ??
        vi.fn().mockResolvedValue({
          data: partial.data,
        });

      // base shape
      const base: QueryResult<TData, TVars> = {
        data: undefined,
        loading: false,
        networkStatus: NetworkStatus.ready,
        error: undefined,
        called: true,
        client: {} as ApolloClient<any>,
        variables: (options?.variables ?? {}) as TVars,
        refetch, // provisional
        fetchMore, // provisional
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
        updateQuery: vi.fn(),
        subscribeToMore: vi.fn(),
        observable: {} as any,
        // user overrides
        ...(partial as any),
      };

      // always ensure these two are the promise-returning ones
      base.refetch = refetch;
      base.fetchMore = fetchMore;

      // add deprecated reobserve to satisfy stricter Apollo typings
      // (TS will mark it deprecated, which is fine for tests)
      (base as any).reobserve = vi.fn().mockResolvedValue(undefined);

      return base;
    }
  );

  return hook;
}
