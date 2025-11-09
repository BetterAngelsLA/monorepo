/**
 * @vitest-environment jsdom
 */
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  type NormalizedCacheObject,
} from '@apollo/client';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PaginationModeEnum } from '../../cachePolicy/constants';
import { createQueryHookMock } from './testUtils';
import { useInfiniteScrollQuery } from './useInfiniteScrollQuery';
import React = require('react');

// mock getQueryPolicyConfigFromCache — define the mock function INSIDE the factory
vi.mock('../../cacheStore/utils/getQueryPolicyConfigFromCache', () => {
  return {
    getQueryPolicyConfigFromCache: (_cache: unknown, fieldName: string) => {
      if (fieldName === 'tasks') {
        return {
          paginationMode: PaginationModeEnum.Offset,
          itemsPath: ['results'],
          totalCountPath: ['totalCount'],
          paginationOffsetPath: ['pagination', 'offset'],
          paginationLimitPath: ['pagination', 'limit'],
        } as const;
      }

      if (fieldName === 'records') {
        return {
          paginationMode: PaginationModeEnum.PerPage,
          itemsPath: ['results'],
          totalCountPath: ['totalCount'],
          paginationPagePath: ['pagination', 'page'],
          paginationPerPagePath: ['pagination', 'perPage'],
        } as const;
      }

      throw new Error(
        `[test] no queryPolicyConfig mock for Query.${fieldName}`
      );
    },
  };
});

// helper: create client
function createTestApolloClient() {
  const cache = new InMemoryCache();
  return new ApolloClient<NormalizedCacheObject>({
    cache,
    uri: '/graphql',
  });
}

// helper: render hook with ApolloProvider, no JSX in .ts
function renderHookWithApollo<T>(callback: () => T) {
  const client = createTestApolloClient();

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(ApolloProvider as any, { client }, children);
  };

  return renderHook(callback, {
    wrapper: Wrapper,
  });
}

describe('useInfiniteScrollQuery', () => {
  it('calls provided query hook with initial offset/limit variables', () => {
    const useQueryHookMock = createQueryHookMock<
      {
        tasks: {
          results: Array<{ id: number }>;
          totalCount: number;
        };
      },
      {
        filters?: { q?: string };
        pagination?: { offset?: number; limit?: number };
      }
    >({
      data: {
        tasks: {
          results: [],
          totalCount: 0,
        },
      },
    });

    renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, typeof useQueryHookMock>({
        useQueryHook: useQueryHookMock,
        queryFieldName: 'tasks',
        variables: {
          filters: { q: 'hello' },
          pagination: { offset: 0, limit: 25 },
        },
        pageSize: 25,
      })
    );

    expect(useQueryHookMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          filters: { q: 'hello' },
          pagination: { offset: 0, limit: 25 },
        },
      })
    );
  });

  it('loadMore uses fetchMore with next offset based on previous request vars', async () => {
    const fetchMore = vi.fn().mockResolvedValue(undefined);

    const useQueryHookMock = createQueryHookMock<
      {
        tasks: {
          results: Array<{ id: number }>;
          totalCount: number;
        };
      },
      {
        pagination?: { offset?: number; limit?: number };
      }
    >({
      data: {
        tasks: {
          results: [{ id: 1 }, { id: 2 }, { id: 3 }],
          totalCount: 6,
        },
      },
      fetchMore,
    });

    const { result } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, typeof useQueryHookMock>({
        useQueryHook: useQueryHookMock,
        queryFieldName: 'tasks',
        variables: {
          pagination: { offset: 0, limit: 3 },
        },
        pageSize: 3,
      })
    );

    await act(async () => {
      result.current.loadMore();
    });

    expect(fetchMore).toHaveBeenCalledWith({
      variables: {
        pagination: {
          offset: 3,
          limit: 3,
        },
      },
    });
  });

  it('computes hasMore from items vs total', () => {
    const useQueryHookMock = createQueryHookMock<
      {
        tasks: {
          results: Array<{ id: number }>;
          totalCount: number;
        };
      },
      Record<string, never>
    >({
      data: {
        tasks: {
          results: [{ id: 1 }],
          totalCount: 2,
        },
      },
    });

    const { result } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, typeof useQueryHookMock>({
        useQueryHook: useQueryHookMock,
        queryFieldName: 'tasks',
        variables: {
          pagination: { offset: 0, limit: 1 },
        },
        pageSize: 1,
      })
    );

    expect(result.current.items).toEqual([{ id: 1 }]);
    expect(result.current.total).toBe(2);
    expect(result.current.hasMore).toBe(true);
  });

  it('respects page/perPage shape and fetches next page using the same perPage', async () => {
    const fetchMore = vi.fn().mockResolvedValue(undefined);

    const useQueryHookMock = createQueryHookMock<
      {
        records: {
          results: Array<{ id: number }>;
          totalCount: number;
        };
      },
      {
        pagination?: { page?: number; perPage?: number };
      }
    >({
      data: {
        records: {
          results: [{ id: 1 }, { id: 2 }],
          totalCount: 4,
        },
      },
      fetchMore,
    });

    const { result } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, typeof useQueryHookMock>({
        useQueryHook: useQueryHookMock,
        queryFieldName: 'records',
        variables: {
          pagination: {
            page: 1,
            perPage: 2,
          },
        },
      })
    );

    await act(async () => {
      result.current.loadMore();
    });

    expect(fetchMore).toHaveBeenCalledWith({
      variables: {
        pagination: {
          page: 2,
          perPage: 2,
        },
      },
    });
  });
});
