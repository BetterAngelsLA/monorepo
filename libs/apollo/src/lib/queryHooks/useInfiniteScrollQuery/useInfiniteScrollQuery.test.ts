/**
 * @vitest-environment jsdom
 */
import React = require('react');

import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  type TypedDocumentNode,
} from '@apollo/client';
import { ApolloProvider, useQuery } from '@apollo/client/react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaginationModeEnum } from '../../cachePolicy/constants';
import { createUseQueryReturn } from './testUtils';
import { useInfiniteScrollQuery } from './useInfiniteScrollQuery';

// Mock only useQuery
vi.mock('@apollo/client/react', async () => {
  const actual = await vi.importActual<any>('@apollo/client/react');
  return { ...actual, useQuery: vi.fn() };
});

// Mock policy reader stays the same...
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

function createTestApolloClient() {
  const cache = new InMemoryCache();
  const link = new HttpLink({ uri: '/graphql' });
  return new ApolloClient({ cache, link });
}

function renderHookWithApollo<T>(callback: () => T) {
  const client = createTestApolloClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(ApolloProvider as any, { client }, children);
  return renderHook(callback, { wrapper: Wrapper });
}

// Typed-only placeholder documents
type TasksData = {
  tasks: { results: Array<{ id: number }>; totalCount: number };
};
type TasksVars = {
  filters?: { q?: string };
  pagination?: { offset?: number; limit?: number };
};
const TasksDocument = {} as unknown as TypedDocumentNode<TasksData, TasksVars>;

type RecordsData = {
  records: { results: Array<{ id: number }>; totalCount: number };
};
type RecordsVars = { pagination?: { page?: number; perPage?: number } };
const RecordsDocument = {} as unknown as TypedDocumentNode<
  RecordsData,
  RecordsVars
>;

describe('useInfiniteScrollQuery (Apollo v4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls useQuery with initial offset/limit variables', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createUseQueryReturn<TasksData, TasksVars>({
        data: { tasks: { results: [], totalCount: 0 } },
        variables: {
          filters: { q: 'hello' },
          pagination: { offset: 0, limit: 25 },
        },
      })
    );

    renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, TasksData, TasksVars>({
        document: TasksDocument,
        queryFieldName: 'tasks',
        variables: {
          filters: { q: 'hello' },
          pagination: { offset: 0, limit: 25 },
        },
        pageSize: 25,
      })
    );

    expect(useQuery).toHaveBeenCalledWith(
      TasksDocument,
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

    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createUseQueryReturn<TasksData, TasksVars>({
        data: {
          tasks: { results: [{ id: 1 }, { id: 2 }, { id: 3 }], totalCount: 6 },
        },
        variables: { pagination: { offset: 0, limit: 3 } },
        fetchMore,
      })
    );

    const { result } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, TasksData, TasksVars>({
        document: TasksDocument,
        queryFieldName: 'tasks',
        variables: { pagination: { offset: 0, limit: 3 } },
        pageSize: 3,
      })
    );

    await act(async () => {
      result.current.loadMore();
    });

    expect(fetchMore).toHaveBeenCalledWith({
      variables: { pagination: { offset: 3, limit: 3 } },
    });
  });

  it('computes hasMore from items vs total', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createUseQueryReturn<TasksData, TasksVars>({
        data: { tasks: { results: [{ id: 1 }], totalCount: 2 } },
        variables: { pagination: { offset: 0, limit: 1 } },
      })
    );

    const { result } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, TasksData, TasksVars>({
        document: TasksDocument,
        queryFieldName: 'tasks',
        variables: { pagination: { offset: 0, limit: 1 } },
        pageSize: 1,
      })
    );

    expect(result.current.items).toEqual([{ id: 1 }]);
    expect(result.current.total).toBe(2);
    expect(result.current.hasMore).toBe(true);
  });

  it('respects page/perPage and fetches the next page with same perPage', async () => {
    const fetchMore = vi.fn().mockResolvedValue(undefined);

    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createUseQueryReturn<RecordsData, RecordsVars>({
        data: { records: { results: [{ id: 1 }, { id: 2 }], totalCount: 4 } },
        variables: { pagination: { page: 1, perPage: 2 } },
        fetchMore,
      })
    );

    const { result } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, RecordsData, RecordsVars>({
        document: RecordsDocument,
        queryFieldName: 'records',
        variables: { pagination: { page: 1, perPage: 2 } },
      })
    );

    await act(async () => {
      result.current.loadMore();
    });

    expect(fetchMore).toHaveBeenCalledWith({
      variables: { pagination: { page: 2, perPage: 2 } },
    });
  });
});
