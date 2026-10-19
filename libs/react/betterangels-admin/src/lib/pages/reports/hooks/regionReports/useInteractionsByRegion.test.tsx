import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { RegionDimension } from '@monorepo/ba-platform/types';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useInteractionsByRegion } from './useInteractionsByRegion';

const ORG = 'org-1';

type Row = {
  __typename: 'RegionCountType';
  kind: string;
  code: string;
  name: string;
  count: number;
  isUnassigned: boolean;
  unassignedReason: null;
};

function row(kind: string, code: string, count: number): Row {
  return {
    __typename: 'RegionCountType',
    kind,
    code,
    name: `${kind} ${code}`,
    count,
    isUnassigned: false,
    unassignedReason: null,
  };
}

/** Deferred so a response can be held open while the assertion runs. */
function deferred() {
  let settle!: (rows: Row[]) => void;
  const promise = new Promise<Row[]>((resolve) => {
    settle = resolve;
  });
  return { promise, settle };
}

/**
 * The hook under test, wired to whatever dimension the test is currently asking for.
 *
 * Renders the row count and the busy flag rather than the rows themselves, because the
 * contract being pinned is about *when* the rows disappear, not their contents.
 */
function Harness({ dimension }: { dimension?: RegionDimension }) {
  const { rows, loading } = useInteractionsByRegion({
    organizationId: ORG,
    dimension,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  });

  return (
    <div>
      <span data-testid="count">{rows.length}</span>
      <span data-testid="loading">{loading ? 'yes' : 'no'}</span>
    </div>
  );
}

describe('useInteractionsByRegion', () => {
  it('keeps the previous rows while a new grouping is loading', async () => {
    const ungrouped = [row('city', 'los-angeles', 40), row('zip', '90011', 12)];
    const grouped = deferred();

    let call = 0;
    const link = new ApolloLink(
      () =>
        new Observable<{ data: { interactionsByRegion: Row[] } }>(
          (observer) => {
            call += 1;
            const first = call === 1;
            const emit = (rows: Row[]) => {
              observer.next({ data: { interactionsByRegion: rows } });
              observer.complete();
            };
            if (first) {
              emit(ungrouped);
            } else {
              grouped.promise.then(emit);
            }
          },
        ),
    );

    const client = new ApolloClient({ link, cache: new InMemoryCache() });
    const { rerender } = render(
      <ApolloProvider client={client}>
        <Harness />
      </ApolloProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('count').textContent).toBe('2'),
    );
    expect(screen.getByTestId('loading').textContent).toBe('no');

    // Choose a grouping. The request is in flight and the previous rows must still be here:
    // this is what stops the panel collapsing and the reader's scroll position being clamped.
    rerender(
      <ApolloProvider client={client}>
        <Harness dimension={RegionDimension.City} />
      </ApolloProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('yes'),
    );
    expect(screen.getByTestId('count').textContent).toBe('2');

    // When the new answer lands, it replaces them.
    grouped.settle([row('city', 'los-angeles', 41)]);
    await waitFor(() =>
      expect(screen.getByTestId('count').textContent).toBe('1'),
    );
    expect(screen.getByTestId('loading').textContent).toBe('no');
  });

  it('hands back one frozen empty array while there are no rows', () => {
    // While the query is in flight `rows` is the fallback. A literal `[]` there is a new
    // identity on every render, which makes every downstream `useMemo` keyed on `rows`
    // recompute for the whole round trip.
    const seen: unknown[] = [];

    function IdentityHarness({ tick }: { tick: number }) {
      const { rows } = useInteractionsByRegion({
        organizationId: ORG,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });
      seen.push(rows);
      return <span data-testid="tick">{tick}</span>;
    }

    // A request that never answers, so every render sees the fallback.
    const link = new ApolloLink(() => new Observable(() => () => undefined));
    const client = new ApolloClient({ link, cache: new InMemoryCache() });
    const { rerender } = render(
      <ApolloProvider client={client}>
        <IdentityHarness tick={0} />
      </ApolloProvider>,
    );
    rerender(
      <ApolloProvider client={client}>
        <IdentityHarness tick={1} />
      </ApolloProvider>,
    );

    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen[0]).toBe(seen[seen.length - 1]);
    // Frozen, so a consumer that writes to it fails loudly rather than corrupting the shared
    // instance for every other consumer.
    expect(Object.isFrozen(seen[0])).toBe(true);
  });
});
