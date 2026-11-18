import {
  DayOfWeekChoices,
  ScheduleTypeChoices,
  type ShelterType,
} from '../../../apollo';
import {
  getAggregateStatus,
  getOperatingStatus,
  getWeeklySchedule,
} from './scheduleUtils';

type Schedule = ShelterType['schedules'][number];

const row = (over: Partial<Schedule>): Schedule =>
  ({
    __typename: 'ScheduleType',
    id: 'row-1',
    scheduleType: ScheduleTypeChoices.Operating,
    day: null,
    startTime: null,
    endTime: null,
    startDate: null,
    endDate: null,
    condition: null,
    isException: false,
    demographic: null,
    ...over,
  }) as Schedule;

const mondayNight = row({
  day: DayOfWeekChoices.Monday,
  startTime: '20:00:00',
  endTime: '08:00:00',
});

const week = (schedules: Schedule[]) =>
  Object.fromEntries(
    getWeeklySchedule(
      schedules,
      ScheduleTypeChoices.Operating,
      new Date(2026, 2, 4, 12, 0),
    ).map((day) => [
      day.day,
      day.windows.map((w) => `${w.startTime}-${w.endTime}`),
    ]),
  );

describe('getWeeklySchedule overnight windows', () => {
  it('splits a Monday overnight window at midnight', () => {
    const result = week([mondayNight]);

    expect(result[DayOfWeekChoices.Monday]).toStrictEqual([
      '20:00:00-23:59:00',
    ]);
    expect(result[DayOfWeekChoices.Tuesday]).toStrictEqual([
      '00:00:00-08:00:00',
    ]);
    expect(result[DayOfWeekChoices.Wednesday]).toStrictEqual([]);
  });

  it('keeps a daytime window on its own day', () => {
    const result = week([
      row({
        day: DayOfWeekChoices.Monday,
        startTime: '09:00:00',
        endTime: '17:00:00',
      }),
    ]);

    expect(result[DayOfWeekChoices.Monday]).toStrictEqual([
      '09:00:00-17:00:00',
    ]);
    expect(result[DayOfWeekChoices.Tuesday]).toStrictEqual([]);
  });

  it('splits an every-day overnight window on every day', () => {
    const result = week([row({ startTime: '22:00:00', endTime: '06:00:00' })]);

    expect(result[DayOfWeekChoices.Monday]).toStrictEqual([
      '00:00:00-06:00:00',
      '22:00:00-23:59:00',
    ]);
    expect(result[DayOfWeekChoices.Sunday]).toStrictEqual([
      '00:00:00-06:00:00',
      '22:00:00-23:59:00',
    ]);
  });

  it('shows a 24 h window as 00:00–23:59 on every day', () => {
    const result = week([row({ startTime: '00:00:00', endTime: '00:00:00' })]);

    expect(Object.values(result)).toHaveLength(7);
    for (const windows of Object.values(result)) {
      expect(windows).toStrictEqual(['00:00:00-23:59:00']);
    }
  });

  it('shows a window that ends at midnight as the minute before it', () => {
    const result = week([
      row({
        day: DayOfWeekChoices.Monday,
        startTime: '20:00:00',
        endTime: '00:00:00',
      }),
    ]);

    expect(result[DayOfWeekChoices.Monday]).toStrictEqual([
      '20:00:00-23:59:00',
    ]);
    expect(result[DayOfWeekChoices.Tuesday]).toStrictEqual([]);
  });

  it('splits a day-specific 24 h window at midnight', () => {
    const result = week([
      row({
        day: DayOfWeekChoices.Monday,
        startTime: '09:00:00',
        endTime: '09:00:00',
      }),
    ]);

    expect(result[DayOfWeekChoices.Monday]).toStrictEqual([
      '09:00:00-23:59:00',
    ]);
    expect(result[DayOfWeekChoices.Tuesday]).toStrictEqual([
      '00:00:00-09:00:00',
    ]);
  });

  it('carries Sunday night into the following Monday', () => {
    const result = week([
      row({
        day: DayOfWeekChoices.Sunday,
        startTime: '20:00:00',
        endTime: '08:00:00',
      }),
    ]);

    // Monday of the displayed week inherits the previous Sunday's tail; the
    // displayed Sunday's tail belongs to the next Monday, outside the week.
    expect(result[DayOfWeekChoices.Monday]).toStrictEqual([
      '00:00:00-08:00:00',
    ]);
    expect(result[DayOfWeekChoices.Sunday]).toStrictEqual([
      '20:00:00-23:59:00',
    ]);
  });

  it('lets an overnight exception clear the next morning', () => {
    const monday = '2026-03-02';

    const result = week([
      mondayNight,
      row({
        isException: true,
        startDate: monday,
        endDate: monday,
        startTime: '20:00:00',
        endTime: '08:00:00',
      }),
    ]);

    expect(result[DayOfWeekChoices.Monday]).toStrictEqual([]);
    expect(result[DayOfWeekChoices.Tuesday]).toStrictEqual([]);
  });

  it('keeps an all-day Monday closure from leaking into Tuesday', () => {
    const result = week([
      mondayNight,
      row({
        isException: true,
        startDate: '2026-03-02',
        endDate: '2026-03-02',
      }),
    ]);

    expect(result[DayOfWeekChoices.Monday]).toStrictEqual([]);
    expect(result[DayOfWeekChoices.Tuesday]).toStrictEqual([
      '00:00:00-08:00:00',
    ]);
  });
});

describe('getOperatingStatus across midnight', () => {
  it('reports the shift end, not the day boundary, mid-evening', () => {
    const status = getOperatingStatus(
      [mondayNight],
      new Date(2026, 2, 2, 22, 0),
    );

    expect(status).toStrictEqual({
      tone: 'open',
      statusText: 'Open now',
      detailText: 'Closes 8:00 AM',
    });
  });

  it('does not call an overnight shift "closing soon" at 11:30 PM', () => {
    const status = getOperatingStatus(
      [mondayNight],
      new Date(2026, 2, 2, 23, 30),
    );

    expect(status).toStrictEqual({
      tone: 'open',
      statusText: 'Open now',
      detailText: 'Closes 8:00 AM',
    });
  });

  it('keeps the aggregate badge open at 11:30 PM', () => {
    const status = getAggregateStatus(
      [mondayNight],
      [ScheduleTypeChoices.Operating],
      new Date(2026, 2, 2, 23, 30),
    );

    expect(status).toStrictEqual({ tone: 'open', statusText: 'Open Now' });
  });

  it('still closes soon for a shift that ends at midnight', () => {
    const status = getOperatingStatus(
      [
        row({
          day: DayOfWeekChoices.Monday,
          startTime: '20:00:00',
          endTime: '00:00:00',
        }),
      ],
      new Date(2026, 2, 2, 23, 30),
    );

    expect(status).toStrictEqual({
      tone: 'closed',
      statusText: 'Closing soon',
      detailText: '12:00 AM',
    });
  });

  it('stops the run where an exception cuts the shift', () => {
    const exception = row({
      isException: true,
      startDate: '2026-03-03',
      endDate: '2026-03-03',
      startTime: '00:00:00',
      endTime: '04:00:00',
    });

    expect(
      getOperatingStatus(
        [mondayNight, exception],
        new Date(2026, 2, 2, 23, 30),
      ),
    ).toStrictEqual({
      tone: 'closed',
      statusText: 'Closing soon',
      detailText: '12:00 AM',
    });

    expect(
      getOperatingStatus([mondayNight, exception], new Date(2026, 2, 3, 4, 30)),
    ).toStrictEqual({
      tone: 'open',
      statusText: 'Open now',
      detailText: 'Closes 8:00 AM',
    });
  });

  it('treats touching windows as one open run', () => {
    const status = getOperatingStatus(
      [
        row({
          id: 'morning',
          day: DayOfWeekChoices.Monday,
          startTime: '09:00:00',
          endTime: '12:00:00',
        }),
        row({
          id: 'afternoon',
          day: DayOfWeekChoices.Monday,
          startTime: '12:00:00',
          endTime: '17:00:00',
        }),
      ],
      new Date(2026, 2, 2, 11, 30),
    );

    // Back-to-back windows are one shift; the shelter is not closing at noon.
    expect(status).toStrictEqual({
      tone: 'open',
      statusText: 'Open now',
      detailText: 'Closes 5:00 PM',
    });
  });

  it('reports no close time for a 24 h schedule', () => {
    const status = getOperatingStatus(
      [row({ startTime: '00:00:00', endTime: '00:00:00' })],
      new Date(2026, 2, 4, 10, 0),
    );

    expect(status).toStrictEqual({
      tone: 'open',
      statusText: 'Open now',
      detailText: '',
    });
  });
});

describe('getAggregateStatus', () => {
  const now = new Date(2026, 2, 3, 15, 30); // Tuesday, 14 minutes before close

  const lateShift = row({
    day: DayOfWeekChoices.Monday,
    startTime: '23:55:00',
    endTime: '15:44:00',
  });

  const intakeClosing = row({
    id: 'intake-closing',
    scheduleType: ScheduleTypeChoices.Intake,
    day: DayOfWeekChoices.Monday,
    startTime: '23:55:00',
    endTime: '15:40:00',
  });

  const intakeClosed = row({
    id: 'intake-closed',
    scheduleType: ScheduleTypeChoices.Intake,
    day: DayOfWeekChoices.Monday,
    startTime: '09:00:00',
    endTime: '10:00:00',
  });

  it('reports closing soon while the hours dialog does', () => {
    expect(getOperatingStatus([lateShift], now).statusText).toBe(
      'Closing soon',
    );
    expect(
      getAggregateStatus([lateShift], [ScheduleTypeChoices.Operating], now),
    ).toStrictEqual({ tone: 'closed', statusText: 'Closing Soon' });
  });

  it('reports closed once the shift has ended', () => {
    const afterClose = new Date(2026, 2, 3, 16, 0);

    expect(getOperatingStatus([lateShift], afterClose).statusText).toBe(
      'Closed',
    );
    expect(
      getAggregateStatus(
        [lateShift],
        [ScheduleTypeChoices.Operating],
        afterClose,
      ),
    ).toStrictEqual({ tone: 'closed', statusText: 'Closed' });
  });

  it('reports closing soon when every open type is closing soon', () => {
    expect(
      getAggregateStatus(
        [lateShift, intakeClosing],
        [ScheduleTypeChoices.Operating, ScheduleTypeChoices.Intake],
        now,
      ),
    ).toStrictEqual({ tone: 'closed', statusText: 'Closing Soon' });
  });

  it('reports partially open when another type is closed', () => {
    // A closing-soon type is still open, so one open + one closed is partial,
    // not closed.
    expect(
      getAggregateStatus(
        [lateShift, intakeClosed],
        [ScheduleTypeChoices.Operating, ScheduleTypeChoices.Intake],
        now,
      ),
    ).toStrictEqual({ tone: 'partial', statusText: 'Partially Open' });
  });

  it('reports open when another type is open beyond the hour', () => {
    const intakeOpen = row({
      id: 'intake-open',
      scheduleType: ScheduleTypeChoices.Intake,
      day: DayOfWeekChoices.Tuesday,
      startTime: '09:00:00',
      endTime: '17:00:00',
    });

    // If a closing-soon type were counted as closed, this would be Partially
    // Open instead, so the case pins the closing-soon-is-open rule.
    expect(
      getAggregateStatus(
        [lateShift, intakeOpen],
        [ScheduleTypeChoices.Operating, ScheduleTypeChoices.Intake],
        now,
      ),
    ).toStrictEqual({ tone: 'open', statusText: 'Open Now' });
  });

  it('reports open when no type is closing soon', () => {
    const operatingOpen = row({
      id: 'operating-open',
      scheduleType: ScheduleTypeChoices.Operating,
      day: DayOfWeekChoices.Tuesday,
      startTime: '09:00:00',
      endTime: '20:00:00',
    });
    const intakeOpen = row({
      id: 'intake-open-wide',
      scheduleType: ScheduleTypeChoices.Intake,
      day: DayOfWeekChoices.Tuesday,
      startTime: '09:00:00',
      endTime: '17:00:00',
    });

    expect(
      getAggregateStatus(
        [operatingOpen, intakeOpen],
        [ScheduleTypeChoices.Operating, ScheduleTypeChoices.Intake],
        now,
      ),
    ).toStrictEqual({ tone: 'open', statusText: 'Open Now' });
  });
});
