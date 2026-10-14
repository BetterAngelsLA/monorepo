import { humanizeDateHmisProd } from './humanizeDateHmisProd';

// Sep 28 2026, 15:30 local — all expectations are relative to this.
const NOW = new Date(2026, 8, 28, 15, 30);

describe('humanizeDateHmisProd', () => {
  it('returns today/yesterday for recent calendar days', () => {
    expect(humanizeDateHmisProd('2026-09-28', NOW)).toBe('today');
    // Clarity includes a time part on `end_date` — same calendar day.
    expect(humanizeDateHmisProd('2026-09-28 00:00:00', NOW)).toBe('today');
    expect(humanizeDateHmisProd('2026-09-27', NOW)).toBe('yesterday');
  });

  it('counts days, weeks and months', () => {
    expect(humanizeDateHmisProd('2026-09-24', NOW)).toBe('4 days ago');
    expect(humanizeDateHmisProd('2026-09-18', NOW)).toBe('1 week ago');
    expect(humanizeDateHmisProd('2026-09-07', NOW)).toBe('3 weeks ago');
    expect(humanizeDateHmisProd('2026-08-28', NOW)).toBe('1 month ago');
    expect(humanizeDateHmisProd('2026-04-28', NOW)).toBe('5 months ago');
  });

  it('uses years + months past a year', () => {
    expect(humanizeDateHmisProd('2025-08-28', NOW)).toBe('1 year 1 month ago');
    expect(humanizeDateHmisProd('2024-09-28', NOW)).toBe('2 years ago');
  });

  it('treats future dates (bad data) as today', () => {
    expect(humanizeDateHmisProd('2026-10-05', NOW)).toBe('today');
  });

  it('returns null for missing or unparseable values', () => {
    expect(humanizeDateHmisProd(null, NOW)).toBeNull();
    expect(humanizeDateHmisProd(undefined, NOW)).toBeNull();
    expect(humanizeDateHmisProd('not a date', NOW)).toBeNull();
  });
});
