import { resolvePreset, resolvePresetValue } from './presets';
import type { DateRange, DateRangePreset, DateRangePresetValue } from './types';

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
      expected: { from: d(2026, 5, 21), to: TODAY },
    },
    {
      preset: 'LAST_30_DAYS',
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

describe('resolvePresetValue', () => {
  it('maps ALL to unbounded', () => {
    expect(resolvePresetValue('ALL')).toEqual({ from: null, to: null });
  });

  it('defers every other value to resolvePreset', () => {
    const cases: DateRangePresetValue[] = [
      'LAST_7_DAYS',
      'MONTH_TO_DATE',
      'CUSTOM',
    ];

    for (const value of cases) {
      expect(resolvePresetValue(value, TODAY)).toEqual(
        resolvePreset(value as DateRangePreset, TODAY),
      );
    }
  });

  it('resolves a relative value against the supplied day', () => {
    // Presets keep the time of `today`; callers day-align when they need to.
    expect(resolvePresetValue('LAST_30_DAYS', TODAY)).toEqual({
      from: new Date(2026, 4, 29),
      to: TODAY,
    });
  });
});
