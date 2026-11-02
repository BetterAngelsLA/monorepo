/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateRangeFilter } from './DateRangeFilter';
import { resolvePresetValue } from './presets';
import type { DateRange, DateRangePresetValue } from './types';

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

/** The trigger renders the selected label; the menu item is the later node. */
function option(name: string) {
  const options = screen.getAllByText(name);

  return options[options.length - 1];
}

const LAST_30 = resolvePresetValue('LAST_30_DAYS');

function renderFilter({
  includeAll,
  preset = 'LAST_30_DAYS',
  value = LAST_30,
  onChange = vi.fn(),
}: {
  includeAll?: boolean;
  preset?: DateRangePresetValue;
  value?: DateRange;
  onChange?: (range: DateRange, preset: DateRangePresetValue) => void;
} = {}) {
  render(
    <DateRangeFilter
      includeAll={includeAll}
      presetLabel="Date range"
      value={value}
      preset={preset}
      onChange={onChange}
    />,
  );

  return onChange;
}

describe('DateRangeFilter', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', NoopResizeObserver);
  });

  it('commits the preset and its resolved range', () => {
    const onChange = renderFilter();

    openMenu();
    fireEvent.click(option('Last 7 Days'));

    expect(onChange).toHaveBeenCalledTimes(1);

    const [range, preset] = (onChange as ReturnType<typeof vi.fn>).mock
      .calls[0] as [DateRange, DateRangePresetValue];

    expect(preset).toBe('LAST_7_DAYS');
    // Presets are resolved from "now", so compare day-aligned bounds rather
    // than the millisecond-exact Date the component saw.
    expect(startOfDay(range.from as Date).getTime()).toBe(
      startOfDay(subDays(new Date(), 6)).getTime(),
    );
    expect(endOfDay(range.to as Date).getTime()).toBe(
      endOfDay(new Date()).getTime(),
    );
  });

  it('ignores a toggle-off when there is no "All time" entry', () => {
    const onChange = renderFilter();

    openMenu();
    fireEvent.click(option('Last 30 Days'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears to "All time" on toggle-off when the entry exists', () => {
    const onChange = renderFilter({ includeAll: true });

    openMenu();
    fireEvent.click(option('Last 30 Days'));

    expect(onChange).toHaveBeenCalledWith({ from: null, to: null }, 'ALL');
  });

  it('previews "Custom" while the calendar is open and reverts on cancel', async () => {
    renderFilter();

    openMenu();
    fireEvent.click(option('Custom'));

    expect(
      await screen.findByRole('dialog', { name: 'Select date range' }),
    ).not.toBeNull();

    const trigger = screen.getByRole('combobox');

    expect(trigger.textContent).toContain('Custom');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger.textContent).toContain('Last 30 Days');
  });

  it('commits a custom range with day-aligned bounds', async () => {
    const onChange = renderFilter();

    openMenu();
    fireEvent.click(option('Custom'));

    fireEvent.change(screen.getByLabelText('Start date'), {
      target: { value: '06/01/2026' },
    });
    fireEvent.change(screen.getByLabelText('End date'), {
      target: { value: '06/15/2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onChange).toHaveBeenCalledTimes(1);

    const [range, preset] = (onChange as ReturnType<typeof vi.fn>).mock
      .calls[0] as [DateRange, DateRangePresetValue];

    expect(preset).toBe('CUSTOM');
    expect(startOfDay(range.from as Date).toISOString()).toBe(
      startOfDay(new Date(2026, 5, 1)).toISOString(),
    );
    expect(endOfDay(range.to as Date).toISOString()).toBe(
      endOfDay(new Date(2026, 5, 15)).toISOString(),
    );
  });
});
