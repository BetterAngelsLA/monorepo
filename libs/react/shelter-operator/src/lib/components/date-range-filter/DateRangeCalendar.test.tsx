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
});
