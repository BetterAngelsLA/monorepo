import { act, render } from '@testing-library/react-native';
import { View } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InfiniteList } from './InfiniteList';
import type { TInfiniteListProps } from './types';

/**
 * InfiniteList load rule: fetch a page when the last row is on screen.
 *
 * FlashList is stubbed to a prop-capture component, so these pin the handler's
 * contract, not the library's integration; that was measured separately (see the
 * PR on the `investigation/infinite-list-paging` branch).
 */

type TRow = { id: string };

const mocks = vi.hoisted(() => ({
  props: undefined as
    | {
        onEndReached?: unknown;
        onViewableItemsChanged?: unknown;
        viewabilityConfig?: unknown;
        viewabilityConfigCallbackPairs?: {
          viewabilityConfig: {
            itemVisiblePercentThreshold?: number;
            minimumViewTime?: number;
          };
          onViewableItemsChanged?: (info: {
            viewableItems: { index: number | null }[];
            changed: { index: number | null }[];
          }) => void;
        }[];
      }
    | undefined,
}));

vi.mock('@shopify/flash-list', () => ({
  FlashList: (props: unknown) => {
    mocks.props = props as typeof mocks.props;

    return null;
  },
}));

const rows = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: String(i + 1) }));

const listWith = (
  count: number,
  listProps: Partial<TInfiniteListProps<TRow>>,
) => (
  <InfiniteList<TRow>
    data={rows(count)}
    renderItem={({ id }) => <View testID={`row-${id}`} />}
    keyExtractor={(item) => item.id}
    totalItems={100}
    {...listProps}
  />
);

type TListProps = Partial<TInfiniteListProps<TRow>> & {
  count?: number;
  loadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
};

async function renderList(props: TListProps) {
  const { count = 2, ...listProps } = props;
  const view = await render(listWith(count, listProps));

  return {
    rerender: (nextCount: number) =>
      view.rerender(listWith(nextCount, listProps)),
  };
}

/** The load rule's own registration, which must be the first pair. */
const pagingEntry = () => mocks.props?.viewabilityConfigCallbackPairs?.[0];

const viewable = (indices: number[]) =>
  act(() =>
    pagingEntry()?.onViewableItemsChanged?.({
      viewableItems: indices.map((index) => ({ index })),
      changed: [],
    }),
  );

describe('InfiniteList load rule', () => {
  beforeEach(() => {
    mocks.props = undefined;
  });

  it('does not load until the last row is on screen', async () => {
    const loadMore = vi.fn();

    await renderList({ loadMore, hasMore: true });

    await viewable([0]);
    expect(loadMore).not.toHaveBeenCalled();

    await viewable([0, 1]);
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('does not load again for the same arrival once the page has landed', async () => {
    const loadMore = vi.fn();

    const { rerender } = await renderList({
      count: 2,
      loadMore,
      hasMore: true,
    });

    await viewable([0, 1]);
    expect(loadMore).toHaveBeenCalledTimes(1);

    await rerender(4);
    await viewable([0, 1]);
    expect(loadMore).toHaveBeenCalledTimes(1);

    await viewable([2, 3]);
    expect(loadMore).toHaveBeenCalledTimes(2);
  });

  it('keeps filling while the last row is still on screen', async () => {
    const loadMore = vi.fn();

    // The pair to "does not load again for the same arrival": here the page that
    // landed still fits, so its last row is on screen and the list fills up.
    const { rerender } = await renderList({
      count: 2,
      loadMore,
      hasMore: true,
    });

    await viewable([0, 1]);
    expect(loadMore).toHaveBeenCalledTimes(1);

    await rerender(4);
    await viewable([0, 1, 2, 3]);
    expect(loadMore).toHaveBeenCalledTimes(2);
  });

  it('still blocks while a request is in flight and when there is nothing more', async () => {
    const loadMore = vi.fn();

    await renderList({ loadMore, hasMore: true, loadingMore: true });
    await viewable([0, 1]);
    expect(loadMore).not.toHaveBeenCalled();

    mocks.props = undefined;
    await renderList({ loadMore, hasMore: false });
    await viewable([0, 1]);
    expect(loadMore).not.toHaveBeenCalled();

    mocks.props = undefined;
    await renderList({ hasMore: true });
    await expect(viewable([0, 1])).resolves.toBeUndefined();
  });

  it('owns the paging threshold and leaves the caller’s viewability props alone', async () => {
    const callerConfig = { itemVisiblePercentThreshold: 100 };
    const callerCallback = vi.fn();
    const callerPair = {
      viewabilityConfig: callerConfig,
      onViewableItemsChanged: vi.fn(),
    };

    await renderList({
      loadMore: vi.fn(),
      hasMore: true,
      onViewableItemsChanged: callerCallback,
      viewabilityConfig: callerConfig,
      viewabilityConfigCallbackPairs: [callerPair],
    });

    expect(pagingEntry()?.viewabilityConfig).toEqual({
      itemVisiblePercentThreshold: 0,
      minimumViewTime: 0,
    });

    expect(mocks.props?.onViewableItemsChanged).toBe(callerCallback);
    expect(mocks.props?.viewabilityConfig).toBe(callerConfig);
    expect(mocks.props?.viewabilityConfigCallbackPairs?.[1]).toBe(callerPair);
  });

  it('does not wire onEndReached', async () => {
    await renderList({ loadMore: vi.fn(), hasMore: true });

    expect(mocks.props?.onEndReached).toBeUndefined();
  });
});
