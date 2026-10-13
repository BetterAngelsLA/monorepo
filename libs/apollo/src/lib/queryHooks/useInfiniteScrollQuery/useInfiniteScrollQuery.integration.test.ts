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

  it('drops a row the server stopped returning, and keeps paging (DEV-2466)', async () => {
    // A mutable server, so a row can disappear between renders the way a
    // client profile does when it is merged away in the Django admin.
    let server = ['1', '2', '3', '4', '5', '6'].map(task);

    const link = new ApolloLink(
      (operation) =>
        new Observable((observer) => {
          const vars = operation.variables as TasksVars;
          const offset = vars.pagination?.offset ?? 0;
          const limit = vars.pagination?.limit ?? PAGE_SIZE;

          observer.next({
            data: {
              tasks: {
                results: server.slice(offset, offset + limit),
                totalCount: server.length,
              },
            },
          });
          observer.complete();
        }),
    );

    const { client } = makeClient(link);
    const variables = {
      filters: { q: 'x' },
      ordering: [{ createdAt: 'DESC' as const }],
    };
    const render = () =>
      renderWithClient(client, () =>
        useInfiniteScrollQuery<TaskItem, TasksData, TasksVars>({
          document: TASKS_DOCUMENT,
          queryFieldName: 'tasks',
          variables,
          pageSize: PAGE_SIZE,
        }),
      );

    const first = render();
    await waitFor(() =>
      expect(first.result.current.items).toHaveLength(PAGE_SIZE),
    );
    await act(async () => {
      first.result.current.loadMore();
    });
    await waitFor(() => expect(first.result.current.items).toHaveLength(TOTAL));

    // "6" is merged away, then the user reopens the list.
    server = server.filter((row) => row.id !== '6');
    first.unmount();

    const second = render();

    // The stale row must not survive the remount, and the list must not be
    // left contradicting its own totalCount.
    await waitFor(() =>
      expect(second.result.current.items.map((item) => item.id)).toEqual([
        '1',
        '2',
        '3',
      ]),
    );
    expect(second.result.current.total).toBe(TOTAL - 1);
    expect(second.result.current.hasMore).toBe(true);

    // ...and the surviving tail is still reachable, with nothing skipped.
    await act(async () => {
      second.result.current.loadMore();
    });
    await waitFor(() =>
      expect(second.result.current.items.map((item) => item.id)).toEqual([
        '1',
        '2',
        '3',
        '4',
        '5',
      ]),
    );
  });

  it('drops a row merged away on a LATER page, not just the first', async () => {
    // The first-page write discards the whole cached list, so a row stranded on
    // page 2 or 3 has to go too — not only the tail of page 1.
    let server = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(task);

    const link = new ApolloLink(
      (operation) =>
        new Observable((observer) => {
          const vars = operation.variables as TasksVars;
          const offset = vars.pagination?.offset ?? 0;
          const limit = vars.pagination?.limit ?? PAGE_SIZE;

          observer.next({
            data: {
              tasks: {
                results: server.slice(offset, offset + limit),
                totalCount: server.length,
              },
            },
          });
          observer.complete();
        }),
    );

    const { client } = makeClient(link);
    const variables = {
      filters: { q: 'x' },
      ordering: [{ createdAt: 'DESC' as const }],
    };
    const render = () =>
      renderWithClient(client, () =>
        useInfiniteScrollQuery<TaskItem, TasksData, TasksVars>({
          document: TASKS_DOCUMENT,
          queryFieldName: 'tasks',
          variables,
          pageSize: PAGE_SIZE,
        }),
      );

    const first = render();
    await waitFor(() =>
      expect(first.result.current.items).toHaveLength(PAGE_SIZE),
    );
    await act(async () => {
      first.result.current.loadMore();
    });
    await waitFor(() =>
      expect(first.result.current.items).toHaveLength(PAGE_SIZE * 2),
    );
    await act(async () => {
      first.result.current.loadMore();
    });
    await waitFor(() =>
      expect(first.result.current.items.map((item) => item.id)).toEqual([
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

    // "5" sits on the second page, well past the page the remount refetches.
    server = server.filter((row) => row.id !== '5');
    first.unmount();

    const second = render();

    await waitFor(() =>
      expect(second.result.current.items.map((item) => item.id)).toEqual([
        '1',
        '2',
        '3',
      ]),
    );
    expect(second.result.current.total).toBe(8);
    expect(second.result.current.hasMore).toBe(true);

    // Page all the way through: "5" must be gone and nothing else skipped.
    await act(async () => {
      second.result.current.loadMore();
    });
    await waitFor(() => expect(second.result.current.items).toHaveLength(6));
    await act(async () => {
      second.result.current.loadMore();
    });
    await waitFor(() =>
      expect(second.result.current.items.map((item) => item.id)).toEqual([
        '1',
        '2',
        '3',
        '4',
        '6',
        '7',
        '8',
        '9',
      ]),
    );
  });
});
