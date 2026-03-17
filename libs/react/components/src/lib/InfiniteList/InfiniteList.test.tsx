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
  it('hides stale items and scroll trigger when loading=true', () => {
    const { container } = render(
      <InfiniteList<TItem> {...defaultProps} loading={true} />
    );

    // Stale items should NOT be visible during a full reload
    expect(screen.queryByTestId('item-0')).toBeNull();
    expect(screen.queryByTestId('item-74')).toBeNull();

    // The scroll trigger should not render during reload either
    // (InfiniteScrollTrigger renders a div with min-h-px mt-4)
    expect(container.querySelector('[class*="min-h-px"]')).toBeNull();
  });

  it('shows items normally when loading=false', () => {
    render(<InfiniteList<TItem> {...defaultProps} loading={false} />);

    expect(screen.getByTestId('item-0')).toBeTruthy();
    expect(screen.getByTestId('item-74')).toBeTruthy();
  });
});
