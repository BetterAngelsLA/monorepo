import { fireEvent, render, screen } from '@testing-library/react';
import { YearGrid } from './YearGrid';

const CURRENT_YEAR = 2026;

function renderGrid(props: Partial<Parameters<typeof YearGrid>[0]> = {}) {
  const onSelect = vi.fn();
  render(
    <YearGrid currentYear={CURRENT_YEAR} onSelect={onSelect} {...props} />,
  );
  return onSelect;
}

const yearButton = (year: number) =>
  screen.getByRole('button', { name: String(year) });

describe('YearGrid', () => {
  it('spans five years back and ten forward from the current year', () => {
    renderGrid();

    const labels = screen
      .getAllByRole('button')
      .map((button) => button.textContent);

    expect(labels).toEqual(
      Array.from({ length: 16 }, (_, i) => String(CURRENT_YEAR - 5 + i)),
    );
  });

  it('moves the window when the current year moves', () => {
    renderGrid({ currentYear: 2031 });

    expect(screen.getByRole('button', { name: '2041' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '2021' })).toBeNull();
  });

  it('marks only the selected year as pressed', () => {
    renderGrid({ selectedYear: 2024 });

    expect(yearButton(2024).getAttribute('aria-pressed')).toBe('true');
    expect(yearButton(2025).getAttribute('aria-pressed')).toBe('false');
  });

  it('marks the current year for assistive tech', () => {
    renderGrid();

    expect(yearButton(CURRENT_YEAR).getAttribute('aria-current')).toBe('date');
    expect(yearButton(2024).getAttribute('aria-current')).toBeNull();
  });

  it('reports the year that was clicked', () => {
    const onSelect = renderGrid({ selectedYear: 2026 });

    fireEvent.click(yearButton(2023));

    expect(onSelect).toHaveBeenCalledWith(2023);
  });
});
