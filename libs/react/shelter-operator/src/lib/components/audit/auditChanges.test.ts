import {
  displayOptionsForAction,
  hasRenderableContent,
  parseFieldChanges,
  subjectActionFor,
} from './auditChanges';

describe('parseFieldChanges', () => {
  it('drops the falsey is_exception default a schedule create carries', () => {
    const changes = parseFieldChanges(
      {
        'is exception': [null, false],
        'start time': ['09:00:00', '10:00:00'],
        'end time': ['17:00:00', '18:00:00'],
      },
      displayOptionsForAction('shelter.schedule.add'),
    );

    expect(changes.map((change) => change.field)).toEqual([
      'start time',
      'end time',
    ]);
    expect(changes[0]).toMatchObject({
      oldValue: '09:00:00',
      newValue: '10:00:00',
    });
  });

  it('drops mechanical/unchanged fields and keeps multi-value changes', () => {
    const changes = parseFieldChanges({
      id: [1, 2],
      'start cycle minutes': [60, 120],
      'duration minutes': [90, 120],
      start_cycle_minutes: [60, 120],
      name: ['Same', 'Same'],
      demographics: [['Women'], ['Men']],
    });

    expect(changes.map((change) => change.field)).toEqual(['demographics']);
    expect(changes[0]).toMatchObject({
      kind: 'multi',
      removed: ['Women'],
      added: ['Men'],
    });
  });

  it('ignores a non-object payload', () => {
    expect(parseFieldChanges(null)).toEqual([]);
    expect(parseFieldChanges(['not', 'an', 'object'])).toEqual([]);
  });
});

describe('subjectActionFor', () => {
  it('picks the schedule event, if any', () => {
    expect(
      subjectActionFor({
        events: [
          { action: 'bed.update' },
          { action: 'shelter.schedule.update' },
        ],
      }),
    ).toBe('shelter.schedule.update');
  });

  it('returns undefined without a schedule event', () => {
    expect(subjectActionFor({ events: [{ action: 'bed.update' }] })).toBe(
      undefined,
    );
  });
});

describe('hasRenderableContent', () => {
  it('hides an action whose only event changed nothing', () => {
    expect(
      hasRenderableContent({
        fieldChanges: {},
        events: [
          {
            action: 'shelter.update',
            summary: null,
            fieldChanges: {},
          },
        ],
      }),
    ).toBe(false);
  });

  it('hides an action with no events and no changes', () => {
    expect(hasRenderableContent({ fieldChanges: {}, events: [] })).toBe(false);
  });

  it('shows a summary-only action', () => {
    expect(
      hasRenderableContent({
        fieldChanges: {},
        events: [
          {
            action: 'bed.update',
            summary: 'Updated Bed A (7)',
            fieldChanges: {},
          },
        ],
      }),
    ).toBe(true);
  });

  it('shows an action with action-level changes', () => {
    expect(
      hasRenderableContent({
        fieldChanges: { name: ['Bed A', 'Bed B'] },
        events: [],
      }),
    ).toBe(true);
  });

  it('shows an event whose diff base is missing (null, not empty)', () => {
    expect(
      hasRenderableContent({
        fieldChanges: {},
        events: [{ action: 'bed.update', summary: null, fieldChanges: null }],
      }),
    ).toBe(true);
  });

  it('shows a truncated action', () => {
    expect(
      hasRenderableContent({
        truncated: true,
        fieldChanges: {},
        events: [],
      }),
    ).toBe(true);
  });
});
