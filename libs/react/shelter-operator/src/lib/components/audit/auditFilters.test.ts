import { endOfDay, startOfDay, subDays } from 'date-fns';
import {
  DEFAULT_AUDIT_PRESET,
  hasDateFilters,
  initialAuditFilters,
  presetRange,
  rangeToFilters,
} from './auditFilters';

// Local wall-clock time, deliberately mid-day: a boundary bug shows up as the
// wrong local hour, not as a timezone-dependent ISO string.
const TODAY = new Date(2026, 5, 27, 14, 30);

describe('presetRange', () => {
  it('maps ALL to unbounded', () => {
    expect(presetRange('ALL')).toEqual({ from: null, to: null });
  });

  it('resolves a relative preset against the supplied day', () => {
    // Presets keep the time of `today`; `rangeToFilters` is what day-aligns.
    expect(presetRange('LAST_30_DAYS', TODAY)).toEqual({
      from: subDays(TODAY, 29),
      to: TODAY,
    });
  });

  it('resolves CUSTOM to unbounded (it is only a calendar label)', () => {
    expect(presetRange('CUSTOM')).toEqual({ from: null, to: null });
  });
});

describe('rangeToFilters', () => {
  it('aligns both ends to local day boundaries', () => {
    const { dateFrom, dateTo } = rangeToFilters({ from: TODAY, to: TODAY });

    expect(new Date(dateFrom as string).getTime()).toBe(
      startOfDay(TODAY).getTime(),
    );
    expect(new Date(dateTo as string).getTime()).toBe(
      endOfDay(TODAY).getTime(),
    );
  });

  it('sends local midnight and the last local millisecond, not UTC bounds', () => {
    const { dateFrom, dateTo } = rangeToFilters({ from: TODAY, to: TODAY });

    const from = new Date(dateFrom as string);
    expect([
      from.getHours(),
      from.getMinutes(),
      from.getSeconds(),
      from.getMilliseconds(),
    ]).toEqual([0, 0, 0, 0]);

    const to = new Date(dateTo as string);
    expect([
      to.getHours(),
      to.getMinutes(),
      to.getSeconds(),
      to.getMilliseconds(),
    ]).toEqual([23, 59, 59, 999]);
  });

  it('uses null, not undefined, for an open end', () => {
    expect(rangeToFilters({ from: null, to: null })).toEqual({
      dateFrom: null,
      dateTo: null,
    });
    expect(rangeToFilters({ from: null, to: TODAY })).toHaveProperty(
      'dateFrom',
      null,
    );
  });
});

describe('hasDateFilters', () => {
  it('is false only when neither bound is set', () => {
    expect(hasDateFilters({})).toBe(false);
    expect(hasDateFilters({ dateFrom: null, dateTo: null })).toBe(false);
    expect(hasDateFilters(initialAuditFilters())).toBe(true);
    expect(hasDateFilters({ dateFrom: '2026-06-01T07:00:00.000Z' })).toBe(true);
  });
});

describe('initialAuditFilters', () => {
  it('opens the log on the 30-day default', () => {
    expect(DEFAULT_AUDIT_PRESET).toBe('LAST_30_DAYS');
    expect(initialAuditFilters()).toEqual(
      rangeToFilters(presetRange(DEFAULT_AUDIT_PRESET)),
    );
  });
});
