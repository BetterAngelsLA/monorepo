import {
  formatFieldValue,
  formatValue,
  humanizeAction,
  MAX_VALUE_LENGTH,
  parseFieldChanges,
  stripHtmlToText,
  truncateValue,
} from './auditChanges';

describe('parseFieldChanges', () => {
  it('parses scalar and multi-value changes', () => {
    const changes = parseFieldChanges({
      name: ['Shelter A', 'Shelter B'],
      demographics: [['Women'], ['Men']],
    });

    expect(changes.map((change) => change.field)).toEqual([
      'name',
      'demographics',
    ]);
    expect(changes[0]).toMatchObject({
      kind: 'scalar',
      oldValue: 'Shelter A',
      newValue: 'Shelter B',
    });
    expect(changes[1]).toMatchObject({
      kind: 'multi',
      removed: ['Women'],
      added: ['Men'],
    });
  });

  it('drops unchanged and empty pair changes', () => {
    const changes = parseFieldChanges({
      name: ['Same', 'Same'],
      demographics: [[], []],
    });

    expect(changes).toEqual([]);
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

describe('humanizeAction', () => {
  it('drops the trailing verb', () => {
    expect(humanizeAction('shelter.update')).toBe('Shelter');
  });
});
