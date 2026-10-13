import { InMemoryCache, gql } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { mergeObjectPayload } from '../../mergeObjectPayload';

/**
 * A write at offset 0 restarts the list, so it replaces what the cache held
 * rather than splicing over it.
 *
 * Splicing a first page leaves rows the server no longer returns stranded at
 * the tail: a client profile merged away in the Django admin keeps rendering
 * while `totalCount` reports the smaller number, and the list can never
 * recover because the stale rows sit past every page the client asks for.
 *
 * Deeper offsets still splice — a page-2 fetch says nothing about page 1.
 */

const QUERY = gql`
  query ClientProfiles($pagination: OffsetPaginationInput) {
    clientProfiles(pagination: $pagination) {
      results {
        id
      }
      totalCount
    }
  }
`;

type TResult = {
  clientProfiles: {
    results: Array<{ id: string } | undefined>;
    totalCount: number;
  };
};

type TVars = { pagination?: { offset?: number; limit?: number } };

const vars = (offset: number, limit = 3): TVars => ({
  pagination: { offset, limit },
});

const client = (id: string) => ({ __typename: 'ClientProfileType', id });

function makeCache() {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          clientProfiles: {
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

const readIds = (cache: InMemoryCache, at = 0) =>
  cache
    .readQuery<TResult>({ query: QUERY, variables: vars(at) })
    ?.clientProfiles.results.map((row) => row?.id);

describe('mergeObjectPayload – a first-page write restarts the list', () => {
  it('drops a tail row the server stopped returning', () => {
    const cache = makeCache();

    cache.writeQuery({
      query: QUERY,
      variables: vars(0),
      data: {
        clientProfiles: {
          results: [client('1'), client('2'), client('3')],
          totalCount: 6,
        },
      },
    });
    cache.writeQuery({
      query: QUERY,
      variables: vars(3),
      data: {
        clientProfiles: {
          results: [client('4'), client('5'), client('6')],
          totalCount: 6,
        },
      },
    });
    expect(readIds(cache)).toEqual(['1', '2', '3', '4', '5', '6']);

    // "6" is merged away; the first page is unchanged, the count is not.
    cache.writeQuery({
      query: QUERY,
      variables: vars(0),
      data: {
        clientProfiles: {
          results: [client('1'), client('2'), client('3')],
          totalCount: 5,
        },
      },
    });

    const result = cache.readQuery<TResult>({
      query: QUERY,
      variables: vars(0),
    });
    expect(result?.clientProfiles.results.map((r) => r?.id)).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(result?.clientProfiles.totalCount).toBe(5);
  });

  it('replaces an over-long list when the first page comes back shorter', () => {
    const cache = makeCache();

    cache.writeQuery({
      query: QUERY,
      variables: vars(0),
      data: {
        clientProfiles: {
          results: [client('1'), client('2'), client('3')],
          totalCount: 3,
        },
      },
    });

    cache.writeQuery({
      query: QUERY,
      variables: vars(0),
      data: {
        clientProfiles: {
          results: [client('1')],
          totalCount: 1,
        },
      },
    });

    expect(readIds(cache)).toEqual(['1']);
  });

  it('still appends at deeper offsets', () => {
    const cache = makeCache();

    cache.writeQuery({
      query: QUERY,
      variables: vars(0),
      data: {
        clientProfiles: {
          results: [client('1'), client('2'), client('3')],
          totalCount: 6,
        },
      },
    });
    cache.writeQuery({
      query: QUERY,
      variables: vars(3),
      data: {
        clientProfiles: {
          results: [client('4'), client('5'), client('6')],
          totalCount: 6,
        },
      },
    });

    expect(readIds(cache)).toEqual(['1', '2', '3', '4', '5', '6']);
  });
});
