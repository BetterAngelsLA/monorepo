import {
  compareReferralLabels,
  formatReferralDate,
  formatReferralEdited,
  formatReferralTimestamp,
} from './referralPresentation';

it('uses explicit English collation, with a deterministic fallback for equivalent labels', () => {
  const compare = vi.spyOn(String.prototype, 'localeCompare');
  try {
    expect(['Zebra', 'Alpha', 'Beta'].sort(compareReferralLabels)).toEqual([
      'Alpha',
      'Beta',
      'Zebra',
    ]);
    expect(compare).toHaveBeenCalledWith('Zebra', 'en-US');
    compare.mockReturnValue(0);
    expect(compareReferralLabels('A', 'a')).toBeLessThan(0);
    expect(compareReferralLabels('a', 'A')).toBeGreaterThan(0);
    expect(compareReferralLabels('same', 'same')).toBe(0);
  } finally {
    compare.mockRestore();
  }
});

it('uses the same explicit local date format without depending on the default locale', () => {
  const localDate = new Date(2026, 9, 4, 12);
  expect(formatReferralDate(localDate.getTime())).toBe('10/04/2026');
  expect(formatReferralDate(localDate.toISOString())).toBe('10/04/2026');
  expect(formatReferralDate('invalid')).toBe('');
  expect(formatReferralDate()).toBe('');
});

it('uses local time today, the shared date for older drafts, and hides invalid values', () => {
  const edited = new Date(2026, 9, 4, 13, 5).getTime();
  expect(formatReferralEdited(edited, new Date(2026, 9, 4, 20).getTime())).toBe(
    ' · 1:05 PM',
  );
  expect(formatReferralEdited(edited, new Date(2026, 9, 5).getTime())).toBe(
    ' · 10/04/2026',
  );
  expect(formatReferralEdited(Number.NaN)).toBe('');
  expect(formatReferralEdited()).toBe('');
  expect(formatReferralEdited(0, new Date(2026, 9, 5).getTime())).not.toBe('');
});

it('labels exported instants with their UTC timezone rather than shifting arrival dates', () => {
  expect(formatReferralTimestamp('2026-10-04T23:05:00Z')).toMatch(
    /Oct 4, 2026.*11:05 PM.*UTC/,
  );
  expect(formatReferralTimestamp('invalid')).toBe('Not recorded');
  expect(formatReferralTimestamp()).toBe('Not recorded');
});
