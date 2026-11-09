import {
  ConditionChoices,
  DayOfWeekChoices,
  ScheduleTypeChoices,
} from '@monorepo/react/shelter';
import { scheduleFormSchema, timeRangeSchema } from './formSchema';
import { buildScheduleInputs } from './utils';
import type { WeeklyFormState } from './types';
import { buildDefaultWeeklyState } from './WeeklyScheduleEditor';

const weeklyWithMondayRanges = (
  ranges: { startTime: string; endTime: string }[],
): WeeklyFormState => {
  const weekly = buildDefaultWeeklyState();

  weekly[DayOfWeekChoices.Monday].ranges = ranges.map((range, index) => ({
    _id: `r${index}`,
    ...range,
  }));

  return weekly;
};

const openException = {
  localId: 'e1',
  startDate: '2026-12-24',
  endDate: '2026-12-26',
  closedAllDay: false,
  startTime: '09:00',
  endTime: '17:00',
};

const issueMessages = (input: unknown) => {
  const result = scheduleFormSchema.safeParse(input);

  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
};

describe('timeRangeSchema', () => {
  it('accepts a start time before the end time', () => {
    expect(
      timeRangeSchema.safeParse({
        _id: 'r1',
        startTime: '09:00',
        endTime: '17:00',
      }).success,
    ).toBe(true);
  });

  it('rejects a malformed time', () => {
    expect(
      timeRangeSchema.safeParse({
        _id: 'r1',
        startTime: '9:00',
        endTime: '17:00',
      }).success,
    ).toBe(false);
  });

  it.each([
    ['17:00', '09:00'],
    ['09:00', '09:00'],
  ])('rejects %s → %s', (startTime, endTime) => {
    expect(
      timeRangeSchema.safeParse({ _id: 'r1', startTime, endTime }).success,
    ).toBe(false);
  });
});

describe('scheduleFormSchema', () => {
  it('accepts a schedule with weekly hours and an open exception', () => {
    expect(
      issueMessages({
        weekly: weeklyWithMondayRanges([
          { startTime: '09:00', endTime: '17:00' },
        ]),
        exceptions: [openException],
      }),
    ).toStrictEqual([]);
  });

  it('accepts a weekly day with no hours', () => {
    expect(
      issueMessages({ weekly: buildDefaultWeeklyState(), exceptions: [] }),
    ).toStrictEqual([]);
  });

  it('rejects a weekly range whose end time is not after the start', () => {
    expect(
      issueMessages({
        weekly: weeklyWithMondayRanges([
          { startTime: '17:00', endTime: '09:00' },
        ]),
        exceptions: [],
      }),
    ).toContain('Start time must be before end time');
  });

  it('ignores the times of an all-day closure', () => {
    expect(
      issueMessages({
        weekly: buildDefaultWeeklyState(),
        exceptions: [
          { ...openException, closedAllDay: true, startTime: '', endTime: '' },
        ],
      }),
    ).toStrictEqual([]);
  });

  it('requires valid times for an exception that is not closed all day', () => {
    // The ordering refinement also fires on the unparsable value, so only the
    // format message is asserted here.
    expect(
      issueMessages({
        weekly: buildDefaultWeeklyState(),
        exceptions: [{ ...openException, startTime: 'not-a-time' }],
      }),
    ).toContain('Invalid time format (HH:MM)');
  });

  it('rejects an end date before the start date', () => {
    expect(
      issueMessages({
        weekly: buildDefaultWeeklyState(),
        exceptions: [
          { ...openException, startDate: '2026-12-26', endDate: '2026-12-24' },
        ],
      }),
    ).toStrictEqual(['Start date must be on or before end date']);
  });

  it('rejects a malformed date', () => {
    expect(
      issueMessages({
        weekly: buildDefaultWeeklyState(),
        exceptions: [{ ...openException, startDate: '24/12/2026' }],
      }),
    ).toContain('Invalid date format (YYYY-MM-DD)');
  });

  it('keeps a saved range id through validation', () => {
    const weekly = weeklyWithMondayRanges([
      { startTime: '09:00', endTime: '12:00' },
    ]);

    weekly[DayOfWeekChoices.Monday].ranges[0].serverId = 'row-1';

    const result = scheduleFormSchema.safeParse({ weekly, exceptions: [] });

    expect(result.success).toBe(true);

    // Parsing is what the form submits with; dropping this key makes every save
    // a delete-and-recreate instead of an in-place update.
    const inputs = buildScheduleInputs(
      ScheduleTypeChoices.Operating,
      result.data!.weekly,
      result.data!.exceptions,
    );

    expect(inputs[0].id).toBe('row-1');
  });

  it('keeps a saved exception id through validation', () => {
    const result = scheduleFormSchema.safeParse({
      weekly: buildDefaultWeeklyState(),
      exceptions: [{ ...openException, serverId: 'row-2' }],
    });

    expect(result.success).toBe(true);

    const inputs = buildScheduleInputs(
      ScheduleTypeChoices.Operating,
      result.data!.weekly,
      result.data!.exceptions,
    );

    expect(inputs[0].id).toBe('row-2');
  });

  it('rejects two weekly ranges that start at the same time', () => {
    const result = scheduleFormSchema.safeParse({
      weekly: weeklyWithMondayRanges([
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '09:00', endTime: '17:00' },
      ]),
      exceptions: [],
    });

    expect(result.success).toBe(false);
    // The error lands on the offending range, so the field shows it.
    expect(result.error?.issues[0].path).toEqual([
      'weekly',
      DayOfWeekChoices.Monday,
      'ranges',
      1,
      'startTime',
    ]);
    expect(result.error?.issues[0].message).toBe(
      'Another range already starts at 09:00',
    );
  });

  it('accepts two weekly ranges with different start times', () => {
    expect(
      issueMessages({
        weekly: weeklyWithMondayRanges([
          { startTime: '09:00', endTime: '12:00' },
          { startTime: '13:00', endTime: '17:00' },
        ]),
        exceptions: [],
      }),
    ).toEqual([]);
  });

  it('rejects two exceptions covering the same date and start time', () => {
    expect(
      issueMessages({
        weekly: buildDefaultWeeklyState(),
        exceptions: [
          { ...openException, localId: 'e1' },
          { ...openException, localId: 'e2', endTime: '20:00' },
        ],
      }),
    ).toContain('Another exception already covers this date and start time');
  });

  it('rejects two all-day exceptions on the same date', () => {
    expect(
      issueMessages({
        weekly: buildDefaultWeeklyState(),
        exceptions: [
          { ...openException, localId: 'e1', closedAllDay: true },
          { ...openException, localId: 'e2', closedAllDay: true },
        ],
      }),
    ).toContain('Another exception already covers this date and start time');
  });

  it('keeps an exception condition', () => {
    const result = scheduleFormSchema.safeParse({
      weekly: buildDefaultWeeklyState(),
      exceptions: [{ ...openException, condition: ConditionChoices.Heat }],
    });

    expect(result.success).toBe(true);
    expect(result.data?.exceptions[0].condition).toBe(ConditionChoices.Heat);
  });
});
