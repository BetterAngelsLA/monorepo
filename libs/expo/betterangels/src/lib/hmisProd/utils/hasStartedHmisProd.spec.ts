import { hasStartedHmisProd } from './hasStartedHmisProd';

// Sep 28 2026, 15:30 local — all expectations are relative to this.
const NOW = new Date(2026, 8, 28, 15, 30);

describe('hasStartedHmisProd', () => {
  it('returns true for past dates and the current calendar day', () => {
    expect(hasStartedHmisProd('2026-09-28', NOW)).toBe(true);
    // Clarity includes a time part on some dates — same calendar day counts.
    expect(hasStartedHmisProd('2026-09-28 00:00:00', NOW)).toBe(true);
    expect(hasStartedHmisProd('2026-01-15', NOW)).toBe(true);
  });

  it('returns false for future dates', () => {
    expect(hasStartedHmisProd('2026-09-29', NOW)).toBe(false);
    expect(hasStartedHmisProd('2026-10-05', NOW)).toBe(false);
  });

  it('returns false for missing or unparseable values', () => {
    expect(hasStartedHmisProd(null, NOW)).toBe(false);
    expect(hasStartedHmisProd(undefined, NOW)).toBe(false);
    expect(hasStartedHmisProd('not a date', NOW)).toBe(false);
  });
});
