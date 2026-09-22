import { toLocalCalendarDate } from '../toLocalCalendarDate';

describe('toLocalCalendarDate — local round-trip', () => {
  it('returns a Date that formats to the same yyyy-MM-dd in the current TZ', () => {
    const input = '2026-10-21';
    const date = toLocalCalendarDate(input);

    expect(date).toBeInstanceOf(Date);
    // toLocaleDateString(en-CA) is just for rendering format (not tz related)
    expect(date?.toLocaleDateString('en-CA')).toBe(input);
  });

  it('handles Date input by preserving the calendar day locally', () => {
    const source = new Date(2026, 9, 21, 23, 45, 10); // local
    const normalized = toLocalCalendarDate(source);

    expect(normalized).toBeInstanceOf(Date);
    // toLocaleDateString(en-CA) is just for rendering format (not tz related)
    expect(normalized?.toLocaleDateString('en-CA')).toBe('2026-10-21');
  });

  it('returns undefined for invalid inputs', () => {
    expect(toLocalCalendarDate(undefined)).toBeUndefined();
    expect(toLocalCalendarDate(null)).toBeUndefined();
    expect(toLocalCalendarDate('not-a-date')).toBeUndefined();
  });
});
