import { InMemoryCache, gql } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { mergeObjectPayload } from '../../mergeObjectPayload';

/**
 * The other merge tests feed plain objects, but a real cache stores
 * references (`{ __ref }`) in `results`. These tests write through an actual
 * InMemoryCache to pin the two properties that matter in production: pages
 * append in order, and overlapping pages never produce `undefined` holes —
 * a hole makes the field unreadable (`readQuery` returns null) and the list
 * goes blank.
 */

const QUERY = gql`
  query Tasks($pagination: OffsetPaginationInput) {
    tasks(pagination: $pagination) {
      results {
        id
      }
      totalCount
    }
  }
`;

type TResult = {
  tasks: {
    results: Array<{ id: string } | undefined>;
    totalCount: number;
  };
};

type TVars = { pagination?: { offset?: number; limit?: number } };

const vars = (offset: number): TVars => ({
  pagination: { offset, limit: 2 },
});

const task = (id: string) => ({ __typename: 'Task', id });

function makeCache() {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          tasks: {
            keyArgs: false,
            merge: mergeObjectPayload<{ id: string }, TVars>({
              resolvePaginationFn: (v) => ({
                offset: v?.pagination?.offset ?? 0,
                limit: v?.pagination?.limit ?? 0,
              }),
            }),
          },
        },
      },
    },
  });
}

describe('mergeObjectPayload – real cache references', () => {
  it('appends non-overlapping pages without holes', () => {
    const cache = makeCache();

    cache.writeQuery({
      query: QUERY,
      variables: vars(0),
      data: { tasks: { results: [task('1'), task('2')], totalCount: 4 } },
    });
    cache.writeQuery({
      query: QUERY,
      variables: vars(2),
      data: { tasks: { results: [task('3'), task('4')], totalCount: 4 } },
    });

    const result = cache.readQuery<TResult>({
      query: QUERY,
      variables: vars(0),
    });

    expect(result?.tasks.results.map((item) => item?.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
    ]);
  });

  it('keeps the field readable when a page overlaps (no holes)', () => {
    const cache = makeCache();

    cache.writeQuery({
      query: QUERY,
      variables: vars(0),
      data: { tasks: { results: [task('1'), task('2')], totalCount: 4 } },
    });
    // the second page overlaps: id "2" appears again at the new offset.
    // Offset pagination cannot reconcile moved items (that needs cursor
    // pagination); what matters here is that the field stays readable and
    // hole-free — duplicates disappear on the next refresh.
    cache.writeQuery({
      query: QUERY,
      variables: vars(2),
      data: { tasks: { results: [task('2'), task('3')], totalCount: 4 } },
    });

    const result = cache.readQuery<TResult>({
      query: QUERY,
      variables: vars(0),
    });

    expect(result).not.toBeNull();
    expect(
      result?.tasks.results.every(
        (item) => item !== undefined && item !== null,
      ),
    ).toBe(true);
    expect(result?.tasks.results.map((item) => item?.id)).toEqual([
      '1',
      '2',
      '2',
      '3',
    ]);
  });
});
