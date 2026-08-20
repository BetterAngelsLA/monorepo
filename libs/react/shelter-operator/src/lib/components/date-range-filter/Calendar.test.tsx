/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Calendar } from './Calendar';

const JUNE_2026 = new Date(2026, 5, 1);
const RANGE = { from: new Date(2026, 5, 10), to: new Date(2026, 5, 18) };

function renderCalendar() {
  const onSelect = vi.fn();
  render(<Calendar selected={RANGE} onSelect={onSelect} month={JUNE_2026} />);
  return onSelect;
}

const clickDay = (day: string) => fireEvent.click(screen.getByText(day));

describe('Calendar range selection', () => {
  it('moves the start when the click is nearer the start', () => {
    const onSelect = renderCalendar();
    clickDay('11');
    expect(onSelect).toHaveBeenCalledWith({
      from: new Date(2026, 5, 11),
      to: RANGE.to,
    });
  });

  it('moves the end when the click is nearer the end', () => {
    const onSelect = renderCalendar();
    clickDay('17');
    expect(onSelect).toHaveBeenCalledWith({
      from: RANGE.from,
      to: new Date(2026, 5, 17),
    });
  });

  it('extends the start when the click falls before the range', () => {
    const onSelect = renderCalendar();
    clickDay('5');
    expect(onSelect).toHaveBeenCalledWith({
      from: new Date(2026, 5, 5),
      to: RANGE.to,
    });
  });

  it('extends the end when the click falls after the range', () => {
    const onSelect = renderCalendar();
    clickDay('25');
    expect(onSelect).toHaveBeenCalledWith({
      from: RANGE.from,
      to: new Date(2026, 5, 25),
    });
  });

  it('starts a fresh range when nothing is selected yet', () => {
    const onSelect = vi.fn();
    render(<Calendar onSelect={onSelect} month={JUNE_2026} />);
    clickDay('12');
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ from: new Date(2026, 5, 12) })
    );
  });
});
