/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { InfiniteList } from './InfiniteList';

type TItem = { id: string; name: string };

const staleItems: TItem[] = Array.from({ length: 75 }, (_, i) => ({
  id: String(i),
  name: `Shelter ${i}`,
}));

const defaultProps = {
  data: staleItems,
  totalItems: 100,
  renderItem: (item: TItem) => (
    <div data-testid={`item-${item.id}`}>{item.name}</div>
  ),
  keyExtractor: (item: TItem) => item.id,
  hasMore: true,
  loadMore: jest.fn(),
};

describe('InfiniteList – variable-change reload', () => {
  it('hides stale items when loading=true (search refresh with old data)', () => {
    render(<InfiniteList<TItem> {...defaultProps} loading={true} />);

    // Stale items should NOT be visible during a full reload
    expect(screen.queryByTestId('item-0')).toBeNull();
    expect(screen.queryByTestId('item-74')).toBeNull();
  });

  it('hides the InfiniteScrollTrigger when loading=true', () => {
    render(<InfiniteList<TItem> {...defaultProps} loading={true} />);

    // The scroll trigger sentinel should not be in the DOM during reload
    // (it would fire loadMore immediately at old scroll position)
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('shows items normally when loading=false', () => {
    render(<InfiniteList<TItem> {...defaultProps} loading={false} />);

    expect(screen.getByTestId('item-0')).toBeTruthy();
    expect(screen.getByTestId('item-74')).toBeTruthy();
  });
});
