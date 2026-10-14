import { formatDateWithRelativeHmisProd } from './formatDateWithRelativeHmisProd';

// Sep 30 2026, 15:30 local — all expectations are relative to this.
const NOW = new Date(2026, 8, 30, 15, 30);

describe('formatDateWithRelativeHmisProd', () => {
  it('appends the humanized relative time to the formatted date', () => {
    expect(formatDateWithRelativeHmisProd('2026-09-28', NOW)).toBe(
      '09/28/2026 (2 days ago)',
    );
    expect(formatDateWithRelativeHmisProd('2026-09-29', NOW)).toBe(
      '09/29/2026 (yesterday)',
    );
    expect(formatDateWithRelativeHmisProd('2026-09-30', NOW)).toBe(
      '09/30/2026 (today)',
    );
  });

  it('formats dates with a time part by their calendar day', () => {
    expect(formatDateWithRelativeHmisProd('2026-09-20 00:00:00', NOW)).toBe(
      '09/20/2026 (1 week ago)',
    );
  });

  it('falls back to the raw value when the date cannot be parsed', () => {
    expect(formatDateWithRelativeHmisProd('not a date', NOW)).toBe(
      'not a date',
    );
  });
});
