/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dateRangeFilterAtom,
  initialDateRangeFilter,
} from './dateRangeFilterAtom';
import { DateRangePresetDropdown } from './DateRangePresetDropdown';

const store = getDefaultStore();

// The dropdown positions its portal with usePortalPosition, which jsdom has no
// ResizeObserver for.
class NoopResizeObserver {
  observe() {
    return undefined;
  }
  unobserve() {
    return undefined;
  }
  disconnect() {
    return undefined;
  }
}

function openMenu() {
  fireEvent.click(screen.getByRole('combobox'));
}

describe('DateRangePresetDropdown', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', NoopResizeObserver);
    store.set(dateRangeFilterAtom, initialDateRangeFilter);
  });

  it('reports a Custom selection without touching the shared filter', () => {
    const onCustomSelected = vi.fn();
    render(<DateRangePresetDropdown onCustomSelected={onCustomSelected} />);

    openMenu();
    fireEvent.click(screen.getByText('Custom'));

    expect(onCustomSelected).toHaveBeenCalledTimes(1);
    expect(store.get(dateRangeFilterAtom)).toEqual(initialDateRangeFilter);
  });

  it('commits a non-custom preset to the shared filter', () => {
    const onCustomSelected = vi.fn();
    render(<DateRangePresetDropdown onCustomSelected={onCustomSelected} />);

    openMenu();
    fireEvent.click(screen.getByText('Last 7 Days'));

    expect(onCustomSelected).not.toHaveBeenCalled();
    expect(store.get(dateRangeFilterAtom).preset).toBe('LAST_7_DAYS');
  });

  it('does not throw when Custom is selected with no handler', () => {
    render(<DateRangePresetDropdown />);

    openMenu();
    expect(() => fireEvent.click(screen.getByText('Custom'))).not.toThrow();
    expect(store.get(dateRangeFilterAtom)).toEqual(initialDateRangeFilter);
  });
});
