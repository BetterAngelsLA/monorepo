/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateRangePicker } from './DateRangePicker';

// The popover positions itself with usePortalPosition, which jsdom has no
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

function renderCalendar() {
  const onCommit = vi.fn();
  render(
    <DateRangePicker value={{ from: null, to: null }} onCommit={onCommit} />,
  );
  return {
    onCommit,
    toggle: screen.getByRole('button', { name: 'Toggle calendar' }),
  };
}

const dialog = () =>
  screen.queryByRole('dialog', { name: 'Select date range' });

const input = (label: string) =>
  screen.getByLabelText(label) as HTMLInputElement;

/**
 * Clicks the day button for an exact `YYYY-MM-DD` cell. Outside days repeat
 * numbers across the two panes, so cells are addressed by `data-day` (which
 * react-day-picker puts on the gridcell) rather than by visible text. The
 * popover is portaled to `document.body`, so query there rather than the
 * render container.
 */
function clickDay(iso: string) {
  const cell = document.querySelector(`[data-day="${iso}"]`);
  if (!cell) throw new Error(`no day cell for ${iso}`);
  fireEvent.click(cell.querySelector('button') as HTMLButtonElement);
}

describe('DateRangePicker', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', NoopResizeObserver);
  });

  it('closes on Escape and restores focus to the toggle', () => {
    const { toggle } = renderCalendar();

    fireEvent.click(toggle);
    expect(
      screen.getByRole('dialog', { name: 'Select date range' }),
    ).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });

  it('leaves the committed value alone when dismissed with Escape', () => {
    const { toggle, onCommit } = renderCalendar();

    fireEvent.click(toggle);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('ignores other keys while open', () => {
    const { toggle } = renderCalendar();

    fireEvent.click(toggle);
    fireEvent.keyDown(document, { key: 'a' });

    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('seeds the draft from the committed range when opened via the open prop', () => {
    const props = {
      onCommit: vi.fn(),
      onOpenChange: vi.fn(),
    };
    const { rerender } = render(
      <DateRangePicker
        {...props}
        open={false}
        value={{ from: new Date(2026, 0, 10), to: new Date(2026, 0, 20) }}
      />,
    );

    // The value changes while the popover is closed (e.g. a preset was picked)…
    rerender(
      <DateRangePicker
        {...props}
        open={false}
        value={{ from: new Date(2026, 5, 1), to: new Date(2026, 5, 30) }}
      />,
    );
    // …then it is opened through the controlled prop, the way the toolbar's
    // preset dropdown opens it when "Custom" is chosen.
    rerender(
      <DateRangePicker
        {...props}
        open
        value={{ from: new Date(2026, 5, 1), to: new Date(2026, 5, 30) }}
      />,
    );

    expect(input('Start date').value).toBe('06/01/2026');
    expect(input('End date').value).toBe('06/30/2026');
    expect(screen.getByText('June 2026')).toBeTruthy();
    expect(screen.queryByText('January 2026')).toBeNull();
  });

  it('commits the drafted range on Save', () => {
    const { onCommit, toggle } = renderCalendar();

    fireEvent.click(toggle);
    fireEvent.change(input('Start date'), { target: { value: '06/01/2026' } });
    fireEvent.change(input('End date'), { target: { value: '06/30/2026' } });
    fireEvent.blur(input('Start date'));

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onCommit).toHaveBeenCalledWith({
      from: new Date(2026, 5, 1),
      to: new Date(2026, 5, 30),
    });
    expect(dialog()).toBeNull();
  });

  it('keeps the popover open when a date field is pressed', () => {
    const { toggle } = renderCalendar();

    fireEvent.click(toggle);
    fireEvent.mouseDown(input('End date'));

    expect(dialog()).not.toBeNull();
  });

  it('closes when a press lands outside the control and the popover', () => {
    const { toggle } = renderCalendar();

    fireEvent.click(toggle);
    fireEvent.mouseDown(document.body);

    expect(dialog()).toBeNull();
  });

  it('does not report a dirty edit when the selection is dismissed with Escape', () => {
    const onDirty = vi.fn();
    render(
      <DateRangePicker
        value={{ from: new Date(2026, 5, 1), to: new Date(2026, 5, 30) }}
        onCommit={vi.fn()}
        onDirty={onDirty}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle calendar' }));

    const start = input('Start date');
    start.focus();
    fireEvent.change(start, { target: { value: '06/05/2026' } });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onDirty).not.toHaveBeenCalled();
    expect(input('Start date').value).toBe('06/01/2026');
  });

  it('keeps each calendar editing its own end of the range', () => {
    const onCommit = vi.fn();
    // Panes open on December 2025 (from) and January 2026 (to).
    render(
      <DateRangePicker
        value={{ from: new Date(2025, 11, 10), to: new Date(2026, 0, 15) }}
        onCommit={onCommit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle calendar' }));

    // 1. A 2026 end date, picked in the to calendar.
    clickDay('2026-01-20');
    // 2. An earlier 2025 start date, picked in the from calendar.
    clickDay('2025-12-05');
    // 3. A later 2025 start date. It sits 24 days after the start and 22 days
    //    before the end, so a distance heuristic sends it to the end date.
    clickDay('2025-12-29');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onCommit).toHaveBeenCalledWith({
      from: new Date(2025, 11, 29),
      to: new Date(2026, 0, 20),
    });
  });

  it('moves the end date for an inside click in the to calendar', () => {
    const onCommit = vi.fn();
    render(
      <DateRangePicker
        value={{ from: new Date(2025, 11, 10), to: new Date(2026, 0, 15) }}
        onCommit={onCommit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle calendar' }));

    // Inside the range, and the to calendar must edit the end date even though
    // a distance heuristic would agree here — this guards the routing itself.
    clickDay('2026-01-06');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onCommit).toHaveBeenCalledWith({
      from: new Date(2025, 11, 10),
      to: new Date(2026, 0, 6),
    });
  });

  it('moves focus into the popover when opened from the toggle', () => {
    const { toggle } = renderCalendar();

    fireEvent.click(toggle);

    expect(document.activeElement).toBe(dialog());
  });

  it('leaves focus in the date field when the field opens the popover', () => {
    renderCalendar();

    const start = input('Start date');
    act(() => start.focus());

    expect(document.activeElement).toBe(start);
  });

  it('returns focus to the toggle after Save and Cancel', () => {
    const { toggle } = renderCalendar();

    fireEvent.click(toggle);
    fireEvent.change(input('Start date'), { target: { value: '06/01/2026' } });
    fireEvent.change(input('End date'), { target: { value: '06/30/2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(document.activeElement).toBe(toggle);

    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(document.activeElement).toBe(toggle);
  });

  it('commits the typed range on Save without waiting for a blur', () => {
    const onCommit = vi.fn();
    render(
      <DateRangePicker
        value={{ from: new Date(2026, 0, 1), to: new Date(2026, 0, 31) }}
        onCommit={onCommit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle calendar' }));
    fireEvent.change(input('Start date'), { target: { value: '06/01/2026' } });
    fireEvent.change(input('End date'), { target: { value: '06/30/2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onCommit).toHaveBeenCalledWith({
      from: new Date(2026, 5, 1),
      to: new Date(2026, 5, 30),
    });
  });

  it('does not commit an invalid typed date on Save', () => {
    const onCommit = vi.fn();
    render(
      <DateRangePicker
        value={{ from: new Date(2026, 0, 1), to: new Date(2026, 0, 31) }}
        onCommit={onCommit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle calendar' }));
    const start = input('Start date');
    fireEvent.change(start, { target: { value: '05/1' } });
    fireEvent.blur(start);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onCommit).not.toHaveBeenCalled();
    expect(dialog()).not.toBeNull();
    expect(screen.getByRole('alert').textContent).toBe(
      'Enter valid start and end dates.',
    );
  });

  it('does not commit a half-open range on Save', () => {
    const onCommit = vi.fn();
    render(
      <DateRangePicker
        value={{ from: new Date(2026, 0, 1), to: new Date(2026, 0, 31) }}
        onCommit={onCommit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle calendar' }));
    fireEvent.change(input('End date'), { target: { value: '' } });
    fireEvent.blur(input('End date'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onCommit).not.toHaveBeenCalled();
    expect(dialog()).not.toBeNull();
    expect(screen.getByRole('alert').textContent).toBe(
      'Select both a start and end date.',
    );
  });

  it('keeps the right pane ahead of a typed start date', () => {
    renderCalendar();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle calendar' }));
    const start = input('Start date');
    fireEvent.change(start, { target: { value: '12/01/2030' } });
    fireEvent.blur(start);

    expect(screen.getByText('December 2030')).toBeTruthy();
    expect(screen.getByText('January 2031')).toBeTruthy();
  });
});
