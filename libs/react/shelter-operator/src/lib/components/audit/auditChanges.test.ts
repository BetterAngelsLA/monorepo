import { formatValue, humanizeAction, parseFieldChanges } from './auditChanges';

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
    expect(formatValue(['a'])).toBe('["a"]');
  });
});

describe('humanizeAction', () => {
  it('drops the trailing verb', () => {
    expect(humanizeAction('shelter.update')).toBe('Shelter');
  });
});
