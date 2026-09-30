/**
 * @vitest-environment jsdom
 *
 * End-to-end integration test for the list-pagination stack — no mocks:
 * getQueryPolicyFactory → assemblePolicyRegistry → generateCachePolicies →
 * createApolloCache → useInfiniteScrollQuery (real useQuery) → real merge →
 * cache reads. This is the seam where the "de-dupe never fired on cache
 * references" class of bugs used to hide.
 */
import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
  gql,
  type TypedDocumentNode,
} from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { generateCachePolicies } from '../../cachePolicy/generateCachePolicies';
import { getQueryPolicyFactory } from '../../cachePolicy/queryPolicyConf/getQueryPolicyFactory';
import { assemblePolicyRegistry } from '../../cachePolicy/queryPolicyConf/utils/assemblePolicyRegistry';
import { createApolloCache } from '../../cacheStore/createApolloCache';
import { useInfiniteScrollQuery } from './useInfiniteScrollQuery';

type TaskItem = { __typename?: 'TaskType'; id: string; title?: string };
type TasksData = {
  tasks: { results: Array<TaskItem>; totalCount: number };
};
type TasksVars = {
  filters?: { q?: string } | null;
  ordering?: Array<{ createdAt?: 'ASC' | 'DESC' }> | null;
  pagination?: { offset?: number; limit?: number } | null;
};

const PAGE_SIZE = 3;
const TOTAL = 6;

const TASKS_DOCUMENT = gql`
  query Tasks(
    $filters: TaskFilter
    $ordering: [TaskOrder!]
    $pagination: OffsetPaginationInput
  ) {
    tasks(filters: $filters, ordering: $ordering, pagination: $pagination) {
      results {
        id
        title
      }
      totalCount
    }
  }
` as unknown as TypedDocumentNode<TasksData, TasksVars>;

const task = (id: string): TaskItem => ({
  __typename: 'TaskType',
  id,
  title: `Task ${id}`,
});

const PAGES: Record<number, TaskItem[]> = {
  0: [task('1'), task('2'), task('3')],
  3: [task('4'), task('5'), task('6')],
};

function makeLink(fetchedOffsets: number[]) {
  return new ApolloLink(
    (operation) =>
      new Observable((observer) => {
        const vars = operation.variables as TasksVars;
        const offset = vars.pagination?.offset ?? 0;

        fetchedOffsets.push(offset);
        observer.next({
          data: {
            tasks: { results: PAGES[offset] ?? [], totalCount: TOTAL },
          },
        });
        observer.complete();
      }),
  );
}

function makeClient(link: ApolloLink) {
  const factory = getQueryPolicyFactory<TasksData, TasksVars>({
    key: 'tasks',
    entityTypename: 'TaskType',
    cacheKeyVariables: ['filters', 'ordering'] as const,
  });

  const registry = assemblePolicyRegistry([factory] as const, {
    isDevEnv: false,
  });
  const typePolicies = generateCachePolicies(registry);
  const cache = createApolloCache({ typePolicies });

  return { cache, client: new ApolloClient({ link, cache }) };
}

function renderWithClient<T>(client: ApolloClient, callback: () => T) {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      ApolloProvider as unknown as React.ComponentType<Record<string, unknown>>,
      { client },
      children,
    );

  return renderHook(callback, { wrapper: Wrapper });
}

// A link whose responses are delivered manually, so tests can control the
// order in which a reload and an in-flight page request come back.
const RACE_PAGE_SIZE = 3;
const RACE_TOTAL = 9;
const RACE_PAGES: Record<number, TaskItem[]> = {
  0: [task('1'), task('2'), task('3')],
  3: [task('4'), task('5'), task('6')],
  6: [task('7'), task('8'), task('9')],
};

function makeDeferredLink() {
  const queue: Array<{ offset: number; respond: () => void }> = [];

  const link = new ApolloLink(
    (operation) =>
      new Observable((observer) => {
        const offset =
          (operation.variables as TasksVars).pagination?.offset ?? 0;

        queue.push({
          offset,
          respond: () => {
            observer.next({
              data: {
                tasks: {
                  results: RACE_PAGES[offset] ?? [],
                  totalCount: RACE_TOTAL,
                },
              },
            });
            observer.complete();
          },
        });
      }),
  );

  const flush = (offset: number) => {
    const index = queue.findIndex((request) => request.offset === offset);

    if (index === -1) {
      throw new Error(
        `[test] nothing pending for offset ${offset}: [${queue
          .map((request) => request.offset)
          .join(', ')}]`,
      );
    }

    const [request] = queue.splice(index, 1);
    request.respond();
  };

  const queuedOffsets = () => queue.map((request) => request.offset);

  return { link, flush, queuedOffsets };
}

describe('useInfiniteScrollQuery – end to end', () => {
  it('fetches, paginates and refetches through the real registry and cache', async () => {
    const fetchedOffsets: number[] = [];
    const { cache, client } = makeClient(makeLink(fetchedOffsets));

    const { result } = renderWithClient(client, () =>
      useInfiniteScrollQuery<TaskItem, TasksData, TasksVars>({
        document: TASKS_DOCUMENT,
        queryFieldName: 'tasks',
        variables: { filters: { q: 'x' }, ordering: [{ createdAt: 'DESC' }] },
        pageSize: PAGE_SIZE,
      }),
    );

    await waitFor(() => expect(result.current.items).toHaveLength(PAGE_SIZE));
    expect(result.current.items.map((item) => item.id)).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(result.current.total).toBe(TOTAL);
    expect(result.current.hasMore).toBe(true);

    // the store key is derived from keyArgs only (filters/ordering) —
    // pagination args must not split the cache entry
    const rootQuery = cache.extract()['ROOT_QUERY'] as Record<string, unknown>;
    const tasksKey = Object.keys(rootQuery).find((key) =>
      key.startsWith('tasks'),
    );
    expect(tasksKey).toBe(
      'tasks:{"filters":{"q":"x"},"ordering":[{"createdAt":"DESC"}]}',
    );

    // loadMore appends the next page through the real merge function
    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() => expect(result.current.items).toHaveLength(TOTAL));
    expect(result.current.items.map((item) => item.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    expect(fetchedOffsets).toEqual([0, 3]);

    // reload() refetches page 1 and the overwrite write resets the list
    await act(async () => {
      await result.current.reload();
    });
    await waitFor(() => expect(result.current.items).toHaveLength(PAGE_SIZE));
    expect(result.current.items.map((item) => item.id)).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(fetchedOffsets[fetchedOffsets.length - 1]).toBe(0);
  });

  it('does not skip a page when a loadMore races a manual reload', async () => {
    const deferred = makeDeferredLink();
    const { client } = makeClient(deferred.link);

    const { result } = renderWithClient(client, () =>
      useInfiniteScrollQuery<TaskItem, TasksData, TasksVars>({
        document: TASKS_DOCUMENT,
        queryFieldName: 'tasks',
        variables: { filters: { q: 'x' }, ordering: [{ createdAt: 'DESC' }] },
        pageSize: RACE_PAGE_SIZE,
      }),
    );

    await waitFor(() => expect(deferred.queuedOffsets()).toEqual([0]));
    deferred.flush(0);
    await waitFor(() =>
      expect(result.current.items.map((item) => item.id)).toEqual([
        '1',
        '2',
        '3',
      ]),
    );

    await act(async () => {
      result.current.loadMore();
      await waitFor(() => expect(deferred.queuedOffsets()).toEqual([3]));
      deferred.flush(3);
    });
    await waitFor(() => expect(result.current.items).toHaveLength(6));

    // pull to refresh, with an eager onEndReached in the same frame (the
    // Android pattern): the page fetch must be dropped before it starts
    await act(async () => {
      const reloadPromise = result.current.reload();
      result.current.loadMore();
      await waitFor(() => expect(deferred.queuedOffsets()).toEqual([0]));
      deferred.flush(0);
      await reloadPromise;
    });
    await waitFor(() => expect(result.current.items).toHaveLength(3));

    // pagination continues from where the reset list ends - offset 3, not 6,
    // which would skip the page that was discarded by the reload
    await act(async () => {
      result.current.loadMore();
      await waitFor(() => expect(deferred.queuedOffsets()).toEqual([3]));
      deferred.flush(3);
    });
    await waitFor(() =>
      expect(result.current.items.map((item) => item.id)).toEqual([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
      ]),
    );

    await act(async () => {
      result.current.loadMore();
      await waitFor(() => expect(deferred.queuedOffsets()).toEqual([6]));
      deferred.flush(6);
    });
    await waitFor(() =>
      expect(result.current.items.map((item) => item.id)).toEqual([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
      ]),
    );
    expect(result.current.hasMore).toBe(false);
  });

  it('keeps pagination contiguous when a superseded page response lands after a reload', async () => {
    const deferred = makeDeferredLink();
    const { client } = makeClient(deferred.link);

    const { result } = renderWithClient(client, () =>
      useInfiniteScrollQuery<TaskItem, TasksData, TasksVars>({
        document: TASKS_DOCUMENT,
        queryFieldName: 'tasks',
        variables: { filters: { q: 'x' }, ordering: [{ createdAt: 'DESC' }] },
        pageSize: RACE_PAGE_SIZE,
      }),
    );

    await waitFor(() => expect(deferred.queuedOffsets()).toEqual([0]));
    deferred.flush(0);
    await waitFor(() => expect(result.current.items).toHaveLength(3));

    // a page request starts ...
    await act(async () => {
      result.current.loadMore();
      await waitFor(() => expect(deferred.queuedOffsets()).toEqual([3]));
    });

    // ... and a pull-to-refresh lands before the page comes back
    await act(async () => {
      const reloadPromise = result.current.reload();
      await waitFor(() => expect(deferred.queuedOffsets()).toEqual([3, 0]));
      deferred.flush(0); // the reload lands first and supersedes the page
      await reloadPromise;
    });
    await waitFor(() => expect(result.current.items).toHaveLength(3));

    // the superseded page still merges (the merge happens in the cache, not
    // in the hook) - it must stay contiguous instead of leaving a gap
    await act(async () => {
      deferred.flush(3);
    });
    await waitFor(() => expect(result.current.items).toHaveLength(6));
    expect(result.current.items.map((item) => item.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);

    // the cursor derives from the list, so the next page continues at 6
    await act(async () => {
      result.current.loadMore();
      await waitFor(() => expect(deferred.queuedOffsets()).toEqual([6]));
      deferred.flush(6);
    });
    await waitFor(() => expect(result.current.items).toHaveLength(9));
    expect(result.current.hasMore).toBe(false);
  });

  it('throws an explicit error when the cache has no registered config', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

    const client = new ApolloClient({
      link: makeLink([]),
      cache: new InMemoryCache(),
    });

    expect(() =>
      renderWithClient(client, () =>
        useInfiniteScrollQuery<TaskItem, TasksData, TasksVars>({
          document: TASKS_DOCUMENT,
          queryFieldName: 'tasks',
          variables: {},
          pageSize: PAGE_SIZE,
        }),
      ),
    ).toThrow(/No queryPolicyConfig found/);

    errorSpy.mockRestore();
  });
});
