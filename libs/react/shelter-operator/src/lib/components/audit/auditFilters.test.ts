import { endOfDay, startOfDay } from 'date-fns';
import { resolvePresetValue } from '../date-range-filter';
import {
  DEFAULT_AUDIT_PRESET,
  hasDateBounds,
  initialAuditFilters,
  rangeToFilters,
} from './auditFilters';

// Local wall-clock time, deliberately mid-day: a boundary bug shows up as the
// wrong local hour, not as a timezone-dependent ISO string.
const TODAY = new Date(2026, 5, 27, 14, 30);
// Distinct endpoints: a bound derived from the wrong end of the range passes
// when both ends sit on the same day.
const FROM = new Date(2026, 5, 21, 14, 30);
const TO = new Date(2026, 5, 27, 9, 10);

describe('rangeToFilters', () => {
  it('aligns both ends to local day boundaries', () => {
    const { dateFrom, dateTo } = rangeToFilters({ from: FROM, to: TO });

    expect(new Date(dateFrom as string).getTime()).toBe(
      startOfDay(FROM).getTime(),
    );
    expect(new Date(dateTo as string).getTime()).toBe(endOfDay(TO).getTime());
  });

  it('sends local midnight and the last local millisecond, not UTC bounds', () => {
    const { dateFrom, dateTo } = rangeToFilters({ from: FROM, to: TO });

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

  it('uses null, not undefined, for either open end', () => {
    expect(rangeToFilters({ from: null, to: null })).toEqual({
      dateFrom: null,
      dateTo: null,
    });
    expect(rangeToFilters({ from: null, to: TODAY })).toHaveProperty(
      'dateFrom',
      null,
    );
    expect(rangeToFilters({ from: TODAY, to: null })).toHaveProperty(
      'dateTo',
      null,
    );
  });
});

describe('hasDateBounds', () => {
  it('is false only when neither bound is set', () => {
    expect(hasDateBounds({})).toBe(false);
    expect(hasDateBounds({ dateFrom: null, dateTo: null })).toBe(false);
    expect(hasDateBounds(initialAuditFilters())).toBe(true);
    expect(hasDateBounds({ dateFrom: '2026-06-01T07:00:00.000Z' })).toBe(true);
    expect(hasDateBounds({ dateTo: '2026-06-30T07:00:00.000Z' })).toBe(true);
  });
});

describe('initialAuditFilters', () => {
  it('opens the log on the 30-day default', () => {
    expect(DEFAULT_AUDIT_PRESET).toBe('LAST_30_DAYS');
    expect(initialAuditFilters()).toEqual(
      rangeToFilters(resolvePresetValue(DEFAULT_AUDIT_PRESET)),
    );
  });
});
