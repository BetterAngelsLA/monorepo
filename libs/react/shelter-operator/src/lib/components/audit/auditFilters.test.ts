import { endOfDay, startOfDay } from 'date-fns';
import { resolvePresetValue } from '../date-range-filter';
import {
  DEFAULT_AUDIT_PRESET,
  hasDateFilters,
  initialAuditFilters,
  rangeToFilters,
} from './auditFilters';

// Local wall-clock time, deliberately mid-day: a boundary bug shows up as the
// wrong local hour, not as a timezone-dependent ISO string.
const TODAY = new Date(2026, 5, 27, 14, 30);

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
      rangeToFilters(resolvePresetValue(DEFAULT_AUDIT_PRESET)),
    );
  });
});
