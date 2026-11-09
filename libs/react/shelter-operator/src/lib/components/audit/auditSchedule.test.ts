import { AuditEventKind } from '@monorepo/ba-platform/types';
import {
  formatScheduleEvent,
  isScheduleEvent,
  withoutScheduleChanges,
} from './auditSchedule';

/** Payload shape of `shelter.schedule.add`, copied from a real shelter log. */
function addedSlot(overrides: Record<string, unknown> = {}) {
  return {
    action: 'shelter.schedule.add',
    kind: AuditEventKind.Insert,
    context: null,
    fieldChanges: {
      day: [null, 'Thursday'],
      'end time': [null, '16:00:00'],
      shelter: [null, 'Gomez Family Sanctuary (id-12)'],
      'start time': [null, '06:00:00'],
      'is exception': [null, false],
      'schedule type': [null, 'Operating Hours'],
    },
    ...overrides,
  };
}

describe('isScheduleEvent', () => {
  it('recognises schedule actions only', () => {
    expect(isScheduleEvent({ action: 'shelter.schedule.add' })).toBe(true);
    expect(isScheduleEvent({ action: 'shelter.update' })).toBe(false);
    expect(isScheduleEvent({ action: 'bed.update' })).toBe(false);
  });
});

describe('formatScheduleEvent', () => {
  it('collapses an added slot to one line', () => {
    expect(formatScheduleEvent(addedSlot())).toEqual({
      tone: 'added',
      text: 'Added Operating Hours: Thursday 06:00 - 16:00',
    });
  });

  it('collapses a removed slot to one line from the old side', () => {
    const removed = addedSlot({
      action: 'shelter.schedule.remove',
      kind: AuditEventKind.Delete,
      fieldChanges: {
        day: ['Thursday', null],
        'end time': ['18:00:00', null],
        shelter: ['Gomez Family Sanctuary (id-12)', null],
        'start time': ['08:00:00', null],
        'is exception': [false, null],
        'schedule type': ['Operating Hours', null],
      },
    });

    expect(formatScheduleEvent(removed)).toEqual({
      tone: 'removed',
      text: 'Removed Operating Hours: Thursday 08:00 - 18:00',
    });
  });

  it('marks an exception slot', () => {
    const day = addedSlot().fieldChanges.day;
    const startTime = addedSlot().fieldChanges['start time'];
    const endTime = addedSlot().fieldChanges['end time'];
    const scheduleType = addedSlot().fieldChanges['schedule type'];

    const exception = addedSlot({
      fieldChanges: {
        day,
        'start time': startTime,
        'end time': endTime,
        'schedule type': scheduleType,
        'is exception': [null, true],
      },
    });

    expect(formatScheduleEvent(exception)?.text).toBe(
      'Added Operating Hours (Exception): Thursday 06:00 - 16:00',
    );
  });

  it('reads the day and type of a netted change from its context', () => {
    // A netted time change: the slot kept its identity, only the window moved.
    const changed = {
      action: 'shelter.schedule.update',
      kind: AuditEventKind.Update,
      context: { day: 'Monday', 'schedule type': 'Intake Hours' },
      fieldChanges: {
        'start time': ['09:00:00', '10:00:00'],
        'end time': ['17:00:00', '18:00:00'],
      },
    };

    expect(formatScheduleEvent(changed)?.text).toBe(
      'Changed Intake Hours: Monday 09:00 - 17:00 \u2192 10:00 - 18:00',
    );
  });

  it('says "Every day" for a slot without a day', () => {
    const everyDay = addedSlot({
      fieldChanges: {
        'start time': [null, '06:00:00'],
        'end time': [null, '16:00:00'],
        'schedule type': [null, 'Operating Hours'],
      },
    });

    expect(formatScheduleEvent(everyDay)?.text).toBe(
      'Added Operating Hours: Every day 06:00 - 16:00',
    );
  });

  it('keeps minutes and real seconds', () => {
    const minutes = addedSlot({
      fieldChanges: {
        day: [null, 'Monday'],
        'start time': [null, '06:30:00'],
        'end time': [null, '16:00:15'],
        'schedule type': [null, 'Operating Hours'],
      },
    });

    expect(formatScheduleEvent(minutes)?.text).toBe(
      'Added Operating Hours: Monday 06:30 - 16:00:15',
    );
  });

  it('shows a dash for a missing time window', () => {
    const noTimes = addedSlot({
      fieldChanges: {
        day: [null, 'Monday'],
        'schedule type': [null, 'Operating Hours'],
      },
    });

    expect(formatScheduleEvent(noTimes)?.text).toBe(
      'Added Operating Hours: Monday \u2014 - \u2014',
    );
  });

  it('returns null for an update with no identity to report', () => {
    // Older rows predate the server sending the slot identity. Guessing
    // "Every day" would be a false statement, so the card falls back to the diff.
    const inPlace = {
      action: 'shelter.schedule.update',
      kind: AuditEventKind.Update,
      context: null,
      fieldChanges: { 'start time': ['09:00:00', '10:00:00'] },
    };

    expect(formatScheduleEvent(inPlace)).toBeNull();
  });

  it('labels an in-place update with the identity the server supplies', () => {
    const inPlace = {
      action: 'shelter.schedule.update',
      kind: AuditEventKind.Update,
      context: { day: 'Wednesday', 'schedule type': 'Operating Hours' },
      fieldChanges: {
        'start time': ['16:23:00', '16:23:00'],
        'end time': ['17:23:00', '20:23:00'],
      },
    };

    expect(formatScheduleEvent(inPlace)?.text).toBe(
      'Changed Operating Hours: Wednesday 16:23 - 17:23 \u2192 16:23 - 20:23',
    );
  });

  it('names the bound that moved when only one side changed', () => {
    const inPlace = {
      action: 'shelter.schedule.update',
      kind: AuditEventKind.Update,
      context: { day: 'Wednesday', 'schedule type': 'Operating Hours' },
      fieldChanges: { 'start time': ['06:30:00', '07:30:00'] },
    };

    expect(formatScheduleEvent(inPlace)?.text).toBe(
      'Changed Operating Hours: Wednesday start time 06:30 \u2192 07:30',
    );
  });

  it('keeps the "every day" wording when the identity has no day', () => {
    const inPlace = {
      action: 'shelter.schedule.update',
      kind: AuditEventKind.Update,
      context: { day: null, 'schedule type': 'Operating Hours' },
      fieldChanges: { 'end time': ['17:00:00', '18:00:00'] },
    };

    expect(formatScheduleEvent(inPlace)?.text).toBe(
      'Changed Operating Hours: Every day end time 17:00 \u2192 18:00',
    );
  });

  it('returns null for a non-schedule event', () => {
    expect(
      formatScheduleEvent({
        action: 'shelter.update',
        kind: AuditEventKind.Update,
        context: null,
        fieldChanges: { name: ['A', 'B'] },
      }),
    ).toBeNull();
  });
});

describe('withoutScheduleChanges', () => {
  it('drops the rows a card renders as lines and keeps the rest', () => {
    const changes = {
      name: ['A', 'B'],
      'Schedule 204 day': [null, 'Thursday'],
      'Schedule 204 is exception': [null, false],
      'Schedule 204 shelter': [null, 'Gomez Family Sanctuary (id-12)'],
    };

    expect(withoutScheduleChanges(changes)).toEqual({ name: ['A', 'B'] });
  });

  it('leaves a payload with no schedule rows alone', () => {
    const changes = { name: ['A', 'B'] };

    expect(withoutScheduleChanges(changes)).toEqual(changes);
    expect(withoutScheduleChanges(null)).toBeNull();
  });
});
