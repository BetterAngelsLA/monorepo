import { InMemoryCache, gql } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { mergeArrayPayload } from '../../mergeArrayPayload';

/**
 * A write at offset 0 restarts the list, so it replaces what the cache held
 * rather than splicing over it.
 *
 * Splicing a first page leaves rows the server no longer returns stranded at
 * the tail — the same hazard `mergeObjectPayload` fixed for DEV-2466, where a
 * merged-away client profile kept rendering. It lives here too, because this
 * merge has the same shape.
 *
 * Deeper offsets still splice — a page-2 fetch says nothing about page 1.
 */

const QUERY = gql`
  query Widgets($pagination: OffsetPaginationInput) {
    widgets(pagination: $pagination) {
      id
    }
  }
`;

type TResult = {
  widgets: Array<{ id: string } | undefined>;
};

type TVars = { pagination?: { offset?: number; limit?: number } };

const vars = (offset: number, limit = 3): TVars => ({
  pagination: { offset, limit },
});

const widget = (id: string) => ({ __typename: 'WidgetType', id });

function makeCache() {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          widgets: {
            keyArgs: false,
            merge: mergeArrayPayload<{ id: string }, TVars>((v) => ({
              offset: v?.pagination?.offset ?? 0,
              limit: v?.pagination?.limit ?? 0,
            })),
          },
        },
      },
    },
  });
}

const readIds = (cache: InMemoryCache, at = 0) =>
  cache
    .readQuery<TResult>({ query: QUERY, variables: vars(at) })
    ?.widgets.map((row) => row?.id);

function seedTwoPages(cache: InMemoryCache) {
  cache.writeQuery({
    query: QUERY,
    variables: vars(0),
    data: { widgets: [widget('1'), widget('2'), widget('3')] },
  });
  cache.writeQuery({
    query: QUERY,
    variables: vars(3),
    data: { widgets: [widget('4'), widget('5'), widget('6')] },
  });
}

describe('mergeArrayPayload – a first-page write restarts the list', () => {
  it('drops a tail row the server stopped returning', () => {
    const cache = makeCache();
    seedTwoPages(cache);
    expect(readIds(cache)).toEqual(['1', '2', '3', '4', '5', '6']);

    // "6" disappears server-side; the first page and its length are unchanged.
    cache.writeQuery({
      query: QUERY,
      variables: vars(0),
      data: { widgets: [widget('1'), widget('2'), widget('3')] },
    });

    expect(readIds(cache)).toEqual(['1', '2', '3']);
  });

  it('replaces an over-long list when the first page comes back shorter', () => {
    const cache = makeCache();
    seedTwoPages(cache);

    cache.writeQuery({
      query: QUERY,
      variables: vars(0),
      data: { widgets: [widget('1')] },
    });

    expect(readIds(cache)).toEqual(['1']);
  });

  it('clears the list when the first page comes back empty', () => {
    const cache = makeCache();
    seedTwoPages(cache);

    cache.writeQuery({
      query: QUERY,
      variables: vars(0),
      data: { widgets: [] },
    });

    expect(readIds(cache)).toEqual([]);
  });

  it('still appends at deeper offsets', () => {
    const cache = makeCache();
    seedTwoPages(cache);

    // A page-2 write proves nothing about page 1, so it must not truncate.
    expect(readIds(cache)).toEqual(['1', '2', '3', '4', '5', '6']);
  });
});
