/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateRangeCalendar } from './DateRangeCalendar';

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
    <DateRangeCalendar value={{ from: null, to: null }} onCommit={onCommit} />
  );
  return {
    onCommit,
    toggle: screen.getByRole('button', { name: 'Toggle calendar' }),
  };
}

const dialog = () => screen.queryByRole('dialog', { name: 'Select date range' });

const input = (label: string) =>
  screen.getByLabelText(label) as HTMLInputElement;

describe('DateRangeCalendar', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', NoopResizeObserver);
  });

  it('closes on Escape and restores focus to the toggle', () => {
    const { toggle } = renderCalendar();

    fireEvent.click(toggle);
    expect(screen.getByRole('dialog', { name: 'Select date range' })).toBeTruthy();

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
      <DateRangeCalendar
        {...props}
        open={false}
        value={{ from: new Date(2026, 0, 10), to: new Date(2026, 0, 20) }}
      />
    );

    // The value changes while the popover is closed (e.g. a preset was picked)…
    rerender(
      <DateRangeCalendar
        {...props}
        open={false}
        value={{ from: new Date(2026, 5, 1), to: new Date(2026, 5, 30) }}
      />
    );
    // …then it is opened through the controlled prop, the way the toolbar's
    // preset dropdown opens it when "Custom" is chosen.
    rerender(
      <DateRangeCalendar
        {...props}
        open
        value={{ from: new Date(2026, 5, 1), to: new Date(2026, 5, 30) }}
      />
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
      <DateRangeCalendar
        value={{ from: new Date(2026, 5, 1), to: new Date(2026, 5, 30) }}
        onCommit={vi.fn()}
        onDirty={onDirty}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle calendar' }));

    const start = input('Start date');
    start.focus();
    fireEvent.change(start, { target: { value: '06/05/2026' } });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onDirty).not.toHaveBeenCalled();
    expect(input('Start date').value).toBe('06/01/2026');
  });
});
