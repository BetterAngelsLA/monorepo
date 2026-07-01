import { resolvePreset } from './presets';
import type { DateRange, DateRangePreset } from './types';

// Fixed reference point so the resolver is deterministic: Sat 27 Jun 2026.
const TODAY = new Date(2026, 5, 27);
const d = (year: number, monthIndex: number, day: number) =>
  new Date(year, monthIndex, day);

describe('resolvePreset', () => {
  const cases: Array<{
    preset: DateRangePreset;
    expected: DateRange;
  }> = [
    {
      preset: 'LAST_7_DAYS',
      // inclusive 7-day window ending today
      expected: { from: d(2026, 5, 21), to: TODAY },
    },
    {
      preset: 'LAST_30_DAYS',
      // inclusive 30-day window ending today
      expected: { from: d(2026, 4, 29), to: TODAY },
    },
    {
      preset: 'MONTH_TO_DATE',
      expected: { from: d(2026, 5, 1), to: TODAY },
    },
    {
      preset: 'YEAR_TO_DATE',
      expected: { from: d(2026, 0, 1), to: TODAY },
    },
    {
      preset: 'CUSTOM',
      expected: { from: null, to: null },
    },
  ];

  it.each(cases)('resolves $preset', ({ preset, expected }) => {
    expect(resolvePreset(preset, TODAY)).toEqual(expected);
  });

  it('defaults `today` to the current date for a relative preset', () => {
    const { from, to } = resolvePreset('LAST_7_DAYS');
    expect(from).toBeInstanceOf(Date);
    expect(to).toBeInstanceOf(Date);
  });
});
