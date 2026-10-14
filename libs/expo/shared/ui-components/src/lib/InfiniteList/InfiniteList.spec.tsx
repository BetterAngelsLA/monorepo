import { act, render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InfiniteList } from './InfiniteList';

/**
 * A list kept mounted but not on screen reads as "at the end" on every commit: on
 * the web deploy the clients list drained to "456 of 456" behind a pushed route.
 *
 * These drive `isFocused` directly, so they need no router. `FocusedInfiniteList`
 * in the app supplies the prop from `useIsFocused`, and is covered there.
 */
const mocks = vi.hoisted(() => ({
  props: undefined as { onEndReached?: () => void } | undefined,
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
  isFocused?: boolean;
};

const list = ({ isFocused = true, ...props }: TProps = {}) => (
  <InfiniteList
    data={rows}
    renderItem={() => null}
    keyExtractor={(item) => item.id}
    totalItems={100}
    isFocused={isFocused}
    {...props}
  />
);

const endReach = () => act(() => mocks.props?.onEndReached?.());

describe('InfiniteList paging', () => {
  beforeEach(() => {
    mocks.props = undefined;
  });

  it('wires no handler while the screen is elsewhere', async () => {
    const loadMore = vi.fn();

    await render(list({ loadMore, hasMore: true, isFocused: false }));

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

  it('pages by default, for a caller with no focus signal to give', async () => {
    const loadMore = vi.fn();

    await render(
      <InfiniteList
        data={rows}
        renderItem={() => null}
        keyExtractor={(item) => item.id}
        totalItems={100}
        loadMore={loadMore}
        hasMore
      />,
    );

    expect(mocks.props?.onEndReached).toBeTypeOf('function');

    await endReach();

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  /**
   * Covers re-attaching the handler, which is all a stubbed list can show. Whether
   * the real FlashList then fires depends on its one-shot end latch, which this
   * mock has none of: the latch is armed while a page fires and is re-armed only by
   * a `data` identity change (`useBoundDetection.js:67-71`), so a list a user left at
   * the end resumes paging on a scroll out of the threshold rather than on refocus
   * alone. That is the accepted cost of withholding the handler — re-arming it by
   * forcing a new `data` identity would re-run FlashList's data update on every
   * refocus — and a stub cannot distinguish the two, so do not read this case as
   * proof that the real list fires.
   */
  it('reattaches the end handler once the screen comes back', async () => {
    const loadMore = vi.fn();

    const view = await render(
      list({ loadMore, hasMore: true, isFocused: false }),
    );
    expect(mocks.props?.onEndReached).toBeUndefined();

    await view.rerender(list({ loadMore, hasMore: true, isFocused: true }));
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
