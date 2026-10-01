import { presentDateHmisProd } from './presentDateHmisProd';

// Sep 28 2026, 15:30 local — all expectations are relative to this.
const NOW = new Date(2026, 8, 28, 15, 30);

describe('presentDateHmisProd', () => {
  it('returns the absolute date with its humanized relative time', () => {
    expect(presentDateHmisProd('2026-09-28', NOW)).toEqual({
      date: '09/28/2026',
      relative: 'today',
    });
    expect(presentDateHmisProd('2026-09-27', NOW)).toEqual({
      date: '09/27/2026',
      relative: 'yesterday',
    });
    // Clarity includes a time part on `end_date` — same calendar day.
    expect(presentDateHmisProd('2026-09-20 00:00:00', NOW)).toEqual({
      date: '09/20/2026',
      relative: '1 week ago',
    });
  });

  it('falls back to the raw value with no relative part when unparseable', () => {
    expect(presentDateHmisProd('not a date', NOW)).toEqual({
      date: 'not a date',
      relative: null,
    });
  });
});
