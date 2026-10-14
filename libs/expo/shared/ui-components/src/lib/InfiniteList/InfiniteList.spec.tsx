import { act, render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InfiniteList } from './InfiniteList';

/**
 * A list kept mounted but not on screen reads as "at the end" on every commit: on
 * the web deploy the clients list drained to "456 of 456" behind a pushed route.
 */
const mocks = vi.hoisted(() => ({
  isFocused: true,
  props: undefined as { onEndReached?: () => void } | undefined,
}));

vi.mock('expo-router', () => ({
  useIsFocused: () => mocks.isFocused,
}));

vi.mock('@shopify/flash-list', () => ({
  FlashList: (props: unknown) => {
    mocks.props = props as typeof mocks.props;

    return null;
  },
}));

const rows = [{ id: '1' }, { id: '2' }];

type TProps = {
  loadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
};

const list = (props: TProps = {}) => (
  <InfiniteList
    data={rows}
    renderItem={() => null}
    keyExtractor={(item) => item.id}
    totalItems={100}
    {...props}
  />
);

const endReach = () => act(() => mocks.props?.onEndReached?.());

describe('InfiniteList paging', () => {
  beforeEach(() => {
    mocks.isFocused = true;
    mocks.props = undefined;
  });

  it('wires no handler while the screen is elsewhere', async () => {
    const loadMore = vi.fn();
    mocks.isFocused = false;

    await render(list({ loadMore, hasMore: true }));

    expect(mocks.props?.onEndReached).toBeUndefined();

    await endReach();

    expect(loadMore).not.toHaveBeenCalled();
  });

  it('pages while the screen is on screen', async () => {
    const loadMore = vi.fn();

    await render(list({ loadMore, hasMore: true }));

    await endReach();

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('handles an end-reach again once the screen comes back', async () => {
    const loadMore = vi.fn();
    mocks.isFocused = false;

    const view = await render(list({ loadMore, hasMore: true }));
    expect(mocks.props?.onEndReached).toBeUndefined();

    mocks.isFocused = true;
    await view.rerender(list({ loadMore, hasMore: true }));
    await endReach();

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('still blocks while loading, with nothing more, or with nothing to call', async () => {
    const loadMore = vi.fn();

    await render(list({ loadMore, hasMore: true, loadingMore: true }));
    await endReach();
    expect(loadMore).not.toHaveBeenCalled();

    mocks.props = undefined;
    await render(list({ loadMore, hasMore: false }));
    await endReach();
    expect(loadMore).not.toHaveBeenCalled();

    mocks.props = undefined;
    await render(list({ hasMore: true }));
    await expect(endReach()).resolves.toBeUndefined();
  });
});
