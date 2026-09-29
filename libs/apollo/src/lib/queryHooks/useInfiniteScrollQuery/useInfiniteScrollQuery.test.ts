/**
 * @vitest-environment jsdom
 */
import { NetworkStatus, type TypedDocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaginationModeEnum } from '../../cachePolicy/constants';
import {
  createUseQueryReturn,
  renderHookWithApollo,
  type MockUseQueryResult,
} from './testUtils';
import { useInfiniteScrollQuery } from './useInfiniteScrollQuery';

// Mock useQuery
vi.mock('@apollo/client/react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    '@apollo/client/react',
  );
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

// Mock policy reader
vi.mock('../../cacheStore/utils/queryPolicyConfigRegistry', () => {
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

      throw new Error(
        `[test] no queryPolicyConfig mock for Query.${fieldName}`,
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
      }),
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
      }),
    );

    expect(useQuery).toHaveBeenCalledWith(
      TasksDocument,
      expect.objectContaining({
        variables: {
          filters: { q: 'hello' },
          pagination: { offset: 0, limit: 25 },
        },
      }),
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
      }),
    );

    const { result } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, TasksData, TasksVars>({
        document: TasksDocument,
        queryFieldName: 'tasks',
        variables: { pagination: { offset: 0, limit: 3 } },
        pageSize: 3,
      }),
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
      }),
    );

    const { result } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, TasksData, TasksVars>({
        document: TasksDocument,
        queryFieldName: 'tasks',
        variables: { pagination: { offset: 0, limit: 1 } },
        pageSize: 1,
      }),
    );

    expect(result.current.items).toEqual([{ id: 1 }]);
    expect(result.current.total).toBe(2);
    expect(result.current.hasMore).toBe(true);
  });

  it('sets loadingMore=true when Apollo networkStatus is fetchMore', () => {
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createUseQueryReturn<TasksData, TasksVars>({
        data: { tasks: { results: [{ id: 1 }], totalCount: 10 } },
        variables: { pagination: { offset: 0, limit: 1 } },
        networkStatus: NetworkStatus.fetchMore,
      }),
    );

    const { result } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, TasksData, TasksVars>({
        document: TasksDocument,
        queryFieldName: 'tasks',
        variables: { pagination: { offset: 0, limit: 1 } },
        pageSize: 1,
      }),
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
      }),
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
      }),
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.reloading).toBe(false);
  });

  it('ignores a fetchMore response that arrives after the variables changed', async () => {
    let resolveFetchMore: (() => void) | undefined;
    const fetchMore = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetchMore = () => resolve(undefined);
        }),
    );

    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createUseQueryReturn<TasksData, TasksVars>({
        data: {
          tasks: { results: [{ id: 1 }, { id: 2 }, { id: 3 }], totalCount: 6 },
        },
        variables: { pagination: { offset: 0, limit: 3 } },
        fetchMore: fetchMore as unknown as MockUseQueryResult<
          TasksData,
          TasksVars
        >['fetchMore'],
        networkStatus: NetworkStatus.ready,
      }),
    );

    let search = 'a';

    const { result, rerender } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, TasksData, TasksVars>({
        document: TasksDocument,
        queryFieldName: 'tasks',
        variables: {
          filters: { q: search },
          pagination: { offset: 0, limit: 3 },
        },
        pageSize: 3,
      }),
    );

    await act(async () => {
      result.current.loadMore();
    });

    expect(fetchMore).toHaveBeenNthCalledWith(1, {
      variables: {
        filters: { q: 'a' },
        pagination: { offset: 3, limit: 3 },
      },
    });

    // query inputs change while the first page request is still in flight
    search = 'b';
    rerender();

    // the response for the old variables finally arrives
    await act(async () => {
      resolveFetchMore?.();
    });

    // the next page must continue from the new query, not the old one
    await act(async () => {
      result.current.loadMore();
    });

    expect(fetchMore).toHaveBeenLastCalledWith({
      variables: {
        filters: { q: 'b' },
        pagination: { offset: 3, limit: 3 },
      },
    });
  });

  it('ignores a fetchMore rejection from a previous variable set', async () => {
    let rejectFetchMore: ((err: unknown) => void) | undefined;
    const fetchMore = vi.fn(
      () =>
        new Promise((_resolve, reject) => {
          rejectFetchMore = reject;
        }),
    );

    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createUseQueryReturn<TasksData, TasksVars>({
        data: {
          tasks: { results: [{ id: 1 }, { id: 2 }, { id: 3 }], totalCount: 6 },
        },
        variables: { pagination: { offset: 0, limit: 3 } },
        fetchMore: fetchMore as unknown as MockUseQueryResult<
          TasksData,
          TasksVars
        >['fetchMore'],
        networkStatus: NetworkStatus.ready,
      }),
    );

    let search = 'a';

    const { result, rerender } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, TasksData, TasksVars>({
        document: TasksDocument,
        queryFieldName: 'tasks',
        variables: {
          filters: { q: search },
          pagination: { offset: 0, limit: 3 },
        },
        pageSize: 3,
      }),
    );

    await act(async () => {
      result.current.loadMore();
    });

    // query inputs change while the first page request is still in flight
    search = 'b';
    rerender();

    // the request for the old variables fails late
    await act(async () => {
      rejectFetchMore?.(new Error('stale failure'));
    });

    // render again so the assertion reads the current ref-backed error state
    rerender();

    expect(result.current.error).toBeUndefined();
  });

  it('keeps the pagination base when a fetchMore resolves after a manual reload', async () => {
    let resolveFetchMore: (() => void) | undefined;
    let fetchMoreCalls = 0;
    const fetchMore = vi.fn(() => {
      fetchMoreCalls += 1;

      if (fetchMoreCalls === 1) {
        return new Promise<void>((resolve) => {
          resolveFetchMore = () => resolve();
        });
      }

      return Promise.resolve(undefined);
    });
    const refetch = vi.fn().mockResolvedValue({ data: undefined });

    const mockResult = createUseQueryReturn<TasksData, TasksVars>({
      data: {
        tasks: { results: [{ id: 1 }, { id: 2 }, { id: 3 }], totalCount: 6 },
      },
      variables: { pagination: { offset: 0, limit: 3 } },
      refetch: refetch as unknown as MockUseQueryResult<
        TasksData,
        TasksVars
      >['refetch'],
      fetchMore: fetchMore as unknown as MockUseQueryResult<
        TasksData,
        TasksVars
      >['fetchMore'],
      networkStatus: NetworkStatus.ready,
    });
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockResult,
    );

    const { result, rerender } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, TasksData, TasksVars>({
        document: TasksDocument,
        queryFieldName: 'tasks',
        variables: {
          filters: { q: 'a' },
          pagination: { offset: 0, limit: 3 },
        },
        pageSize: 3,
      }),
    );

    // page-2 request starts
    await act(async () => {
      result.current.loadMore();
    });

    expect(fetchMore).toHaveBeenNthCalledWith(1, {
      variables: {
        filters: { q: 'a' },
        pagination: { offset: 3, limit: 3 },
      },
    });

    // Apollo reports the in-flight fetchMore
    mockResult.networkStatus = NetworkStatus.fetchMore;
    rerender();

    // pull to refresh while the page-2 request is still in flight
    await act(async () => {
      await result.current.reload();
    });

    // the page-2 response arrives after the refresh and must be ignored
    await act(async () => {
      resolveFetchMore?.();
    });

    mockResult.networkStatus = NetworkStatus.ready;
    rerender();

    // the next page must continue from page 1 (offset 3) — not offset 6,
    // which would skip a page and leave unreadable holes in the cache
    await act(async () => {
      result.current.loadMore();
    });

    expect(fetchMore).toHaveBeenLastCalledWith({
      variables: {
        filters: { q: 'a' },
        pagination: { offset: 3, limit: 3 },
      },
    });
    expect(result.current.error).toBeUndefined();
  });

  it('ignores a fetchMore rejection that arrives after a manual reload', async () => {
    let rejectFetchMore: ((err: unknown) => void) | undefined;
    const fetchMore = vi.fn(
      () =>
        new Promise((_resolve, reject) => {
          rejectFetchMore = reject;
        }),
    );
    const refetch = vi.fn().mockResolvedValue({ data: undefined });

    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createUseQueryReturn<TasksData, TasksVars>({
        data: {
          tasks: { results: [{ id: 1 }, { id: 2 }, { id: 3 }], totalCount: 6 },
        },
        variables: { pagination: { offset: 0, limit: 3 } },
        refetch: refetch as unknown as MockUseQueryResult<
          TasksData,
          TasksVars
        >['refetch'],
        fetchMore: fetchMore as unknown as MockUseQueryResult<
          TasksData,
          TasksVars
        >['fetchMore'],
        networkStatus: NetworkStatus.ready,
      }),
    );

    const { result, rerender } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, TasksData, TasksVars>({
        document: TasksDocument,
        queryFieldName: 'tasks',
        variables: {
          filters: { q: 'a' },
          pagination: { offset: 0, limit: 3 },
        },
        pageSize: 3,
      }),
    );

    await act(async () => {
      result.current.loadMore();
    });

    // pull to refresh while the page-2 request is still in flight
    await act(async () => {
      await result.current.reload();
    });

    // the request for the pre-reload state fails late
    await act(async () => {
      rejectFetchMore?.(new Error('late failure'));
    });

    rerender();

    expect(result.current.error).toBeUndefined();
  });

  it('reload() after loadMore refetches from the first page', async () => {
    const refetch = vi.fn().mockResolvedValue({ data: undefined });
    const fetchMore = vi.fn().mockResolvedValue(undefined);

    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createUseQueryReturn<TasksData, TasksVars>({
        data: {
          tasks: { results: [{ id: 1 }, { id: 2 }, { id: 3 }], totalCount: 6 },
        },
        variables: { pagination: { offset: 0, limit: 3 } },
        refetch: refetch as unknown as MockUseQueryResult<
          TasksData,
          TasksVars
        >['refetch'],
        fetchMore: fetchMore as unknown as MockUseQueryResult<
          TasksData,
          TasksVars
        >['fetchMore'],
        networkStatus: NetworkStatus.ready,
      }),
    );

    const { result } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, TasksData, TasksVars>({
        document: TasksDocument,
        queryFieldName: 'tasks',
        variables: {
          filters: { q: 'a' },
          pagination: { offset: 0, limit: 3 },
        },
        pageSize: 3,
      }),
    );

    await act(async () => {
      result.current.loadMore();
    });

    await act(async () => {
      await result.current.reload();
    });

    // the first page variables must not have been mutated by loadMore
    expect(refetch).toHaveBeenCalledWith({
      filters: { q: 'a' },
      pagination: { offset: 0, limit: 3 },
    });
  });

  it('returns a stable queryKey that only changes when the query inputs change', async () => {
    const fetchMore = vi.fn().mockResolvedValue(undefined);

    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createUseQueryReturn<TasksData, TasksVars>({
        data: {
          tasks: { results: [{ id: 1 }, { id: 2 }, { id: 3 }], totalCount: 6 },
        },
        variables: { pagination: { offset: 0, limit: 3 } },
        fetchMore: fetchMore as unknown as MockUseQueryResult<
          TasksData,
          TasksVars
        >['fetchMore'],
        networkStatus: NetworkStatus.ready,
      }),
    );

    let search = 'a';

    const { result, rerender } = renderHookWithApollo(() =>
      useInfiniteScrollQuery<{ id: number }, TasksData, TasksVars>({
        document: TasksDocument,
        queryFieldName: 'tasks',
        variables: {
          filters: { q: search },
          pagination: { offset: 0, limit: 3 },
        },
        pageSize: 3,
      }),
    );

    const initialKey = result.current.queryKey;

    // re-rendering with deep-equal variables keeps the same key
    rerender();
    expect(result.current.queryKey).toBe(initialKey);

    // loading another page must not change the key
    await act(async () => {
      result.current.loadMore();
    });
    expect(result.current.queryKey).toBe(initialKey);

    // changing the query inputs produces a new key
    search = 'b';
    rerender();
    expect(result.current.queryKey).not.toBe(initialKey);
  });
});
