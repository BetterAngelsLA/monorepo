import { endOfDay, startOfDay, subDays } from 'date-fns';
import {
  DEFAULT_AUDIT_PRESET,
  hasDateBounds,
  initialAuditFilter,
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

  it('omits the actor keys when no actor is selected', () => {
    // Absent, not null: the queried variable set must match the unfiltered one.
    expect(rangeToFilters({ from: FROM, to: TO })).not.toHaveProperty(
      'actorId',
    );
    expect(rangeToFilters({ from: FROM, to: TO })).not.toHaveProperty(
      'systemOnly',
    );
  });

  it('keeps the dates when an actor is applied', () => {
    // The two dimensions are independent: picking an actor must not widen the
    // range that is already on screen.
    expect(
      rangeToFilters(
        { from: FROM, to: TO },
        {
          id: 'user-1',
          label: 'Ada Lovelace',
          isSystem: false,
        },
      ),
    ).toEqual({
      dateFrom: startOfDay(FROM).toISOString(),
      dateTo: endOfDay(TO).toISOString(),
      actorId: 'user-1',
    });
  });

  it('maps the system actor to systemOnly, never to a null actorId', () => {
    const filters = rangeToFilters(
      { from: FROM, to: TO },
      {
        id: null,
        label: 'System',
        isSystem: true,
      },
    );

    expect(filters).toHaveProperty('systemOnly', true);
    expect(filters).not.toHaveProperty('actorId');
  });
});

describe('hasDateBounds', () => {
  it('is false only when neither bound is set', () => {
    expect(hasDateBounds({})).toBe(false);
    expect(hasDateBounds({ dateFrom: null, dateTo: null })).toBe(false);
    expect(hasDateBounds(initialAuditFilter().filters)).toBe(true);
    expect(hasDateBounds({ dateFrom: '2026-06-01T07:00:00.000Z' })).toBe(true);
    expect(hasDateBounds({ dateTo: '2026-06-30T07:00:00.000Z' })).toBe(true);
  });

  it('ignores the actor filters, so the copy follows the date bounds', () => {
    // An actor with an "All Time" range is filtered but has no date bounds: the
    // empty state says "No activity", not "in the selected date range".
    expect(
      hasDateBounds({ dateFrom: null, dateTo: null, actorId: 'user-1' }),
    ).toBe(false);
    expect(
      hasDateBounds({ dateFrom: null, dateTo: null, systemOnly: true }),
    ).toBe(false);
  });
});

describe('initialAuditFilter', () => {
  it('opens the log on the 30-day default, from one clock read', () => {
    expect(DEFAULT_AUDIT_PRESET).toBe('LAST_30_DAYS');

    const { preset, range, filters } = initialAuditFilter(TODAY);

    expect(preset).toBe('LAST_30_DAYS');
    expect(range).toEqual({ from: subDays(TODAY, 29), to: TODAY });
    // The query bounds are derived from the very range the bar displays, so
    // the two cannot be seeded from different instants.
    expect(filters).toEqual(rangeToFilters(range));
  });
});
