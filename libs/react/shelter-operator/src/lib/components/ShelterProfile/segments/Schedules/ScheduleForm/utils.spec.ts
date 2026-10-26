import {
  ConditionChoices,
  DayOfWeekChoices,
  ScheduleTypeChoices,
  type ScheduleType,
} from '@monorepo/react/shelter';
import type { ExceptionEntry } from './types';
import {
  buildScheduleInputs,
  hydrateExceptions,
  hydrateWeekly,
  toHHMM,
} from './utils';
import { buildDefaultWeeklyState } from './WeeklyScheduleEditor';

const OPERATING = ScheduleTypeChoices.Operating;

const schedule = (overrides: Partial<ScheduleType>): ScheduleType =>
  ({
    id: 's1',
    scheduleType: OPERATING,
    isException: false,
    ...overrides,
  }) as ScheduleType;

const exception = (overrides: Partial<ExceptionEntry>): ExceptionEntry => ({
  localId: 'e1',
  startDate: '2026-12-24',
  endDate: '2026-12-26',
  closedAllDay: false,
  startTime: '10:00',
  endTime: '12:00',
  ...overrides,
});

describe('toHHMM', () => {
  it('truncates a HH:MM:SS time to HH:MM', () => {
    expect(toHHMM('09:30:00')).toBe('09:30');
  });

  it('returns an empty string for a missing time', () => {
    expect(toHHMM(null)).toBe('');
    expect(toHHMM(undefined)).toBe('');
  });
});

describe('hydrateWeekly', () => {
  it('groups ranges by day and keeps only HH:MM', () => {
    const weekly = hydrateWeekly([
      schedule({
        id: 'a',
        day: DayOfWeekChoices.Monday,
        startTime: '09:00:00',
        endTime: '17:00:00',
      }),
      schedule({
        id: 'b',
        day: DayOfWeekChoices.Monday,
        startTime: '18:00:00',
        endTime: '20:00:00',
      }),
    ]);

    expect(weekly[DayOfWeekChoices.Monday].ranges).toStrictEqual([
      { _id: 'a', startTime: '09:00', endTime: '17:00' },
      { _id: 'b', startTime: '18:00', endTime: '20:00' },
    ]);
  });

  it('leaves days without hours empty', () => {
    const weekly = hydrateWeekly([
      schedule({ day: DayOfWeekChoices.Monday, startTime: '09:00:00' }),
    ]);

    expect(weekly[DayOfWeekChoices.Sunday].ranges).toStrictEqual([]);
    expect(weekly[DayOfWeekChoices.Tuesday].ranges).toStrictEqual([]);
  });

  it('skips entries without a day', () => {
    const weekly = hydrateWeekly([
      schedule({ startTime: '09:00:00', endTime: '17:00:00' }),
    ]);

    const allRanges = Object.values(weekly).flatMap((day) => day.ranges);

    expect(allRanges).toStrictEqual([]);
  });

  it('falls back to a positional id when the entry has none', () => {
    const weekly = hydrateWeekly([
      {
        ...schedule({
          day: DayOfWeekChoices.Monday,
          startTime: '09:00:00',
          endTime: '17:00:00',
        }),
        id: undefined,
      } as unknown as ScheduleType,
    ]);

    expect(weekly[DayOfWeekChoices.Monday].ranges[0]._id).toBe('MONDAY-0');
  });
});

describe('hydrateExceptions', () => {
  it('treats an exception without times as an all-day closure', () => {
    expect(
      hydrateExceptions([schedule({ isException: true, id: 'x' })]),
    ).toStrictEqual([
      {
        localId: 'x',
        startDate: '',
        endDate: '',
        closedAllDay: true,
        startTime: '',
        endTime: '',
        condition: undefined,
      },
    ]);
  });

  it('derives closedAllDay from the missing times and mirrors startDate', () => {
    const [entry] = hydrateExceptions([
      schedule({
        isException: true,
        id: 'x',
        startDate: '2026-12-25',
        condition: ConditionChoices.Heat,
      }),
    ]);

    expect(entry.closedAllDay).toBe(true);
    expect(entry.endDate).toBe('2026-12-25');
    expect(entry.condition).toBe(ConditionChoices.Heat);
  });
});

describe('buildScheduleInputs', () => {
  it('builds weekly inputs in day order, skipping incomplete ranges', () => {
    const weekly = buildDefaultWeeklyState();

    weekly[DayOfWeekChoices.Monday].ranges = [
      { _id: 'a', startTime: '09:00', endTime: '17:00' },
      { _id: 'b', startTime: '18:00', endTime: '' },
    ];
    weekly[DayOfWeekChoices.Sunday].ranges = [
      { _id: 'c', startTime: '22:00', endTime: '23:30' },
    ];

    expect(buildScheduleInputs(OPERATING, weekly, [])).toStrictEqual([
      {
        scheduleType: OPERATING,
        days: [DayOfWeekChoices.Monday],
        startTime: '09:00:00',
        endTime: '17:00:00',
        isException: false,
      },
      {
        scheduleType: OPERATING,
        days: [DayOfWeekChoices.Sunday],
        startTime: '22:00:00',
        endTime: '23:30:00',
        isException: false,
      },
    ]);
  });

  it('builds exception inputs, dropping times for an all-day closure', () => {
    expect(
      buildScheduleInputs(OPERATING, buildDefaultWeeklyState(), [
        exception({
          startDate: '2026-12-25',
          endDate: '',
          closedAllDay: true,
          startTime: '10:00',
          endTime: '12:00',
        }),
        exception({
          startDate: '2026-12-31',
          endDate: '2027-01-01',
          condition: ConditionChoices.Heat,
        }),
      ]),
    ).toStrictEqual([
      {
        scheduleType: OPERATING,
        startDate: '2026-12-25',
        endDate: '2026-12-25',
        startTime: undefined,
        endTime: undefined,
        condition: undefined,
        isException: true,
      },
      {
        scheduleType: OPERATING,
        startDate: '2026-12-31',
        endDate: '2027-01-01',
        startTime: '10:00:00',
        endTime: '12:00:00',
        condition: ConditionChoices.Heat,
        isException: true,
      },
    ]);
  });

  it('skips exceptions without a start date', () => {
    expect(
      buildScheduleInputs(OPERATING, buildDefaultWeeklyState(), [
        exception({ startDate: '' }),
      ]),
    ).toStrictEqual([]);
  });
});
