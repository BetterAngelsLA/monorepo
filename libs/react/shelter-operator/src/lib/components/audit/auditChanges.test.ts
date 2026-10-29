import {
  displayOptionsForAction,
  formatValue,
  hasRenderableContent,
  MAX_VALUE_LENGTH,
  parseFieldChanges,
  stripHtmlToText,
  subjectActionFor,
  truncateValue,
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

describe('formatValue', () => {
  it('formats booleans, empty values, and arrays', () => {
    expect(formatValue(true)).toBe('Yes');
    expect(formatValue(false)).toBe('No');
    expect(formatValue(null)).toBe('\u2014');
    expect(formatValue([])).toBe('\u2014');
    expect(formatValue(['a'])).toBe('a');
    expect(formatValue(['Women', 'Men'])).toBe('Women, Men');
  });

  it('renders rich text as text instead of markup', () => {
    expect(formatValue('<p>Old <b>copy</b></p>')).toBe('Old copy');
    expect(formatValue('<p>Old</p><p>New</p>')).toBe('Old New');
    expect(formatValue('<p>Fish &amp; Chips</p>')).toBe('Fish & Chips');
    expect(formatValue('&lt;tag&gt;')).toBe('<tag>');
    expect(formatValue('<p></p>')).toBe('\u2014');
    expect(formatValue('<p>Hi</p><script>alert(1)</script>')).toBe('Hi');
    expect(formatValue('a<br>b')).toBe('a b');
  });

  it('leaves plain text with an angle bracket untouched', () => {
    expect(formatValue('a < b')).toBe('a < b');
    expect(stripHtmlToText('a < b')).toBe('a < b');
  });
});

describe('truncateValue', () => {
  it('leaves short values alone', () => {
    expect(truncateValue('short')).toBe('short');
  });

  it('caps long values with an ellipsis', () => {
    const truncated = truncateValue('x'.repeat(200));

    expect(truncated.length).toBe(MAX_VALUE_LENGTH);
    expect(truncated.endsWith('\u2026')).toBe(true);
    expect(truncateValue('abcdef', 4)).toBe('abc\u2026');
  });
});
