/**
 * @vitest-environment jsdom
 */
import { NetworkStatus, type TypedDocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaginationModeEnum } from '../../cachePolicy/constants';
import { createUseQueryReturn, renderHookWithApollo } from './testUtils';
import { useInfiniteScrollQuery } from './useInfiniteScrollQuery';

// Mock useQuery
vi.mock('@apollo/client/react', async () => {
  const actual = await vi.importActual<any>('@apollo/client/react');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

// Mock policy reader
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
        networkStatus: NetworkStatus.ready,
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
        networkStatus: NetworkStatus.ready,
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
        networkStatus: NetworkStatus.ready,
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
        networkStatus: NetworkStatus.ready,
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

  it('sets loadingMore=true when Apollo networkStatus is fetchMore', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createUseQueryReturn<TasksData, TasksVars>({
        data: { tasks: { results: [{ id: 1 }], totalCount: 10 } },
        variables: { pagination: { offset: 0, limit: 1 } },
        networkStatus: NetworkStatus.fetchMore,
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

    expect(result.current.loadingMore).toBe(true);
  });

  it('treats setVariables as loading (variable-change in-flight)', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createUseQueryReturn<TasksData, TasksVars>({
        data: { tasks: { results: [{ id: 1 }], totalCount: 10 } },
        variables: {
          filters: { q: 'new' },
          pagination: { offset: 0, limit: 1 },
        },
        networkStatus: NetworkStatus.setVariables,
      })
    );

    const { result } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, TasksData, TasksVars>({
        document: TasksDocument,
        queryFieldName: 'tasks',
        variables: {
          filters: { q: 'new' },
          pagination: { offset: 0, limit: 1 },
        },
        pageSize: 1,
      })
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.reloading).toBe(false);
  });
});
