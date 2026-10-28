import {
  displayOptionsForAction,
  formatFieldValue,
  formatValue,
  humanizeAction,
  MAX_VALUE_LENGTH,
  parseFieldChanges,
  stripHtmlToText,
  subjectActionFor,
  truncateValue,
} from './auditChanges';

describe('parseFieldChanges', () => {
  it('drops the absent/`false` is exception default a schedule create carries', () => {
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

  it('drops the same default on the qualified key the collapsed card renders', () => {
    // §13 qualifies a related row's key (`<Model> <id> <field>`), and the
    // action-level rollup is what a collapsed card shows. A bare-key-only rule
    // would leave the noise on screen.
    const changes = parseFieldChanges(
      {
        'Schedule 209 is exception': [null, false],
        'Schedule 209 start time': [null, '09:00:00'],
      },
      displayOptionsForAction('shelter.schedule.add'),
    );

    expect(changes.map((change) => change.field)).toEqual([
      'Schedule 209 start time',
    ]);
  });

  it('keeps a real is exception change, bare or qualified', () => {
    // The rule drops the *default*, never an actual exception/regular flip.
    for (const field of ['is exception', 'Schedule 209 is exception']) {
      const changes = parseFieldChanges(
        { [field]: [false, true] },
        displayOptionsForAction('shelter.schedule.update'),
      );

      expect(changes.map((change) => change.field)).toEqual([field]);
    }
  });

  it('keeps the is exception default outside schedule events', () => {
    // A future field with the same display name on another subject must not be
    // curated by the schedule rule.
    const changes = parseFieldChanges({ 'is exception': [null, false] });

    expect(changes.map((change) => change.field)).toEqual(['is exception']);
  });

  it('hides the pk and generated columns by display name', () => {
    // Defence in depth: `_scalar_changes` already drops these (§13). Keys are
    // display names — the pk is `ID` — and may be qualified.
    const changes = parseFieldChanges({
      ID: [null, 7],
      'Schedule 209 start cycle minutes': [60, 120],
      'duration minutes': [90, 120],
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

describe('formatFieldValue', () => {
  it('labels related choice values by field', () => {
    expect(formatFieldValue('Storage', 'shared_storage')).toBe(
      'Shared Storage',
    );
    expect(formatFieldValue('Storage', 'unit_storage')).toBe(
      'Unit-level Storage',
    );
    expect(formatFieldValue('Parking', 'street')).toBe('Street Parking');
    expect(formatFieldValue('Pets', 'pet_area')).toBe('Pet Area');
    expect(formatFieldValue('Shelter types', 'safe_parking')).toBe(
      'Safe Parking',
    );
    expect(formatFieldValue('Demographics', 'families')).toBe('Families');
    expect(formatFieldValue('Accessibility', 'ada_rooms')).toBe(
      'ADA Rooms Available',
    );
  });

  it('labels arrays of choice values', () => {
    expect(
      formatFieldValue('Storage', ['shared_storage', 'unit_storage']),
    ).toBe('Shared Storage, Unit-level Storage');
  });

  it('falls back for unknown fields, unknown codes, and plain values', () => {
    expect(formatFieldValue('Notes', 'shared_storage')).toBe('shared_storage');
    expect(formatFieldValue('Storage', 'not_a_storage_choice')).toBe(
      'not_a_storage_choice',
    );
    expect(formatFieldValue('Pets', null)).toBe('\u2014');
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

describe('humanizeAction', () => {
  it('drops the trailing verb', () => {
    expect(humanizeAction('shelter.update')).toBe('Shelter');
  });
});
