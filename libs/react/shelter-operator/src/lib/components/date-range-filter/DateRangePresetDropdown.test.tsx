/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateRangePresetDropdown } from './DateRangePresetDropdown';

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

function option(name: string) {
  const options = screen.getAllByText(name);
  // The trigger also renders the selected label; the menu item is the later
  // node (the menu is portalled to the end of the document).
  return options[options.length - 1];
}

describe('DateRangePresetDropdown', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', NoopResizeObserver);
  });

  it('emits the selected preset', () => {
    const onChange = vi.fn();
    render(
      <DateRangePresetDropdown value="LAST_30_DAYS" onChange={onChange} />,
    );

    openMenu();
    fireEvent.click(option('Last 7 Days'));

    expect(onChange).toHaveBeenCalledWith('LAST_7_DAYS');
  });

  it('reports CUSTOM like any other entry', () => {
    const onChange = vi.fn();
    render(
      <DateRangePresetDropdown value="LAST_30_DAYS" onChange={onChange} />,
    );

    openMenu();
    fireEvent.click(option('Custom'));

    // The widget assigns no meaning to CUSTOM; the caller decides.
    expect(onChange).toHaveBeenCalledWith('CUSTOM');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('reports a toggle-off as null so the caller decides', () => {
    const onChange = vi.fn();
    render(<DateRangePresetDropdown value="LAST_7_DAYS" onChange={onChange} />);

    openMenu();
    fireEvent.click(option('Last 7 Days'));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('offers "All time" in the menu only when asked', () => {
    const { unmount } = render(
      <DateRangePresetDropdown value="LAST_30_DAYS" onChange={vi.fn()} />,
    );

    openMenu();
    expect(
      within(screen.getByRole('listbox')).queryByText('All time'),
    ).toBeNull();
    unmount();

    render(
      <DateRangePresetDropdown value="ALL" includeAll onChange={vi.fn()} />,
    );

    // The trigger would read "All time" from `value` alone, so the menu entry
    // is what proves `includeAll` added it.
    openMenu();
    expect(
      within(screen.getByRole('listbox')).getByText('All time'),
    ).not.toBeNull();
  });

  it('labels the control when a label is given', () => {
    render(
      <DateRangePresetDropdown
        value="LAST_30_DAYS"
        onChange={vi.fn()}
        label="Date range"
      />,
    );

    // The visible label is the caller's; the combobox itself is named by the
    // shared Dropdown, which this widget only forwards the label to.
    expect(screen.getByText('Date range')).not.toBeNull();
  });
});
