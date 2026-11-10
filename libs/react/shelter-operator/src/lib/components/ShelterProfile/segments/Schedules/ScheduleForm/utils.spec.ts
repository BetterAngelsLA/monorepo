import {
  ConditionChoices,
  DayOfWeekChoices,
  ScheduleTypeChoices,
  type ScheduleType,
} from '@monorepo/react/shelter';
import type { ExceptionEntry } from './types';
import {
  buildScheduleInputs,
  unrepresentableInputs,
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
  isDateRange: true,
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
      {
        _id: 'a',
        serverId: 'a',
        startTime: '09:00',
        endTime: '17:00',
        condition: undefined,
        startDate: undefined,
        endDate: undefined,
      },
      {
        _id: 'b',
        serverId: 'b',
        startTime: '18:00',
        endTime: '20:00',
        condition: undefined,
        startDate: undefined,
        endDate: undefined,
      },
    ]);
  });

  it('leaves days without hours empty', () => {
    const weekly = hydrateWeekly([
      schedule({
        day: DayOfWeekChoices.Monday,
        startTime: '09:00:00',
        endTime: '17:00:00',
      }),
    ]);

    expect(weekly[DayOfWeekChoices.Monday].ranges).toStrictEqual([
      {
        _id: 's1',
        serverId: 's1',
        startTime: '09:00',
        endTime: '17:00',
        condition: undefined,
        startDate: undefined,
        endDate: undefined,
      },
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
        serverId: 'x',
        startDate: '',
        isDateRange: false,
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
    expect(entry.isDateRange).toBe(false);
    expect(entry.condition).toBe(ConditionChoices.Heat);
  });

  it('hydrates a multi-day exception as a date range', () => {
    const [entry] = hydrateExceptions([
      schedule({
        isException: true,
        id: 'x',
        startDate: '2026-12-24',
        endDate: '2026-12-26',
      }),
    ]);

    expect(entry.startDate).toBe('2026-12-24');
    expect(entry.endDate).toBe('2026-12-26');
    expect(entry.isDateRange).toBe(true);
  });
});

describe('hidden weekly fields', () => {
  it('carries a condition the editor cannot show through to the payload', () => {
    const weekly = hydrateWeekly([
      schedule({
        id: 'a',
        day: DayOfWeekChoices.Monday,
        startTime: '09:00:00',
        endTime: '17:00:00',
        condition: ConditionChoices.Heat,
      }),
    ]);

    const [input] = buildScheduleInputs(OPERATING, weekly, []);

    // The save writes the whole row, so dropping this here clears it.
    expect(input.condition).toBe(ConditionChoices.Heat);
  });
});

describe('unrepresentableInputs', () => {
  it('sends a day-less slot back unchanged so the save does not delete it', () => {
    const everyDay = schedule({
      id: 'row-ever',
      day: null,
      startTime: '06:00:00',
      endTime: '18:00:00',
      condition: ConditionChoices.Heat,
    });

    expect(
      unrepresentableInputs([everyDay], ScheduleTypeChoices.Operating),
    ).toStrictEqual([
      {
        id: 'row-ever',
        scheduleType: ScheduleTypeChoices.Operating,
        startTime: '06:00:00',
        endTime: '18:00:00',
        startDate: undefined,
        endDate: undefined,
        condition: ConditionChoices.Heat,
        isException: false,
      },
    ]);
  });

  it('ignores day-specific and exception rows', () => {
    expect(
      unrepresentableInputs(
        [
          schedule({ id: 'mon', day: DayOfWeekChoices.Monday }),
          schedule({ id: 'ex', isException: true, startDate: '2026-12-25' }),
        ],
        ScheduleTypeChoices.Operating,
      ),
    ).toEqual([]);
  });
});

describe('buildScheduleInputs', () => {
  it('builds weekly inputs in day order, skipping incomplete ranges', () => {
    const weekly = buildDefaultWeeklyState();

    weekly[DayOfWeekChoices.Monday].ranges = [
      { _id: 'a', serverId: 'row-a', startTime: '09:00', endTime: '17:00' },
      { _id: 'b', serverId: 'row-b', startTime: '18:00', endTime: '' },
    ];
    weekly[DayOfWeekChoices.Sunday].ranges = [
      { _id: 'c', startTime: '22:00', endTime: '23:30' },
    ];

    expect(buildScheduleInputs(OPERATING, weekly, [])).toStrictEqual([
      {
        id: 'row-a',
        scheduleType: OPERATING,
        days: [DayOfWeekChoices.Monday],
        startTime: '09:00:00',
        endTime: '17:00:00',
        startDate: undefined,
        endDate: undefined,
        condition: undefined,
        isException: false,
      },
      {
        id: undefined,
        scheduleType: OPERATING,
        days: [DayOfWeekChoices.Sunday],
        startTime: '22:00:00',
        endTime: '23:30:00',
        startDate: undefined,
        endDate: undefined,
        condition: undefined,
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
        id: undefined,
        scheduleType: OPERATING,
        startDate: '2026-12-25',
        endDate: '2026-12-25',
        startTime: undefined,
        endTime: undefined,
        condition: undefined,
        isException: true,
      },
      {
        id: undefined,
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
