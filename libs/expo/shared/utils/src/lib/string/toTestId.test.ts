import { describe, expect, it } from 'vitest';
import { toTestId } from './toTestId';

type TTestCase = [Parameters<typeof toTestId>[0], string];

const testCases: TTestCase[] = [
  // basic value only
  [{ value: 'hello' }, 'hello'],
  // prefix
  [
    { prefix: 'client-card', value: 'e2e-test-client' },
    'client-card-e2e-test-client',
  ],
  // suffix
  [{ value: 'John', suffix: 'Doe' }, 'john-doe'],
  // prefix + value + suffix
  [
    { prefix: 'note-card', value: 'interaction-1785966140837' },
    'note-card-interaction-1785966140837',
  ],
  // case normalization (prefix, value, suffix)
  [{ value: 'tAbS' }, 'tabs'],
  [{ prefix: 'TAB', value: 'Interactions' }, 'tab-interactions'],
  // whitespace collapsed to dashes
  [{ prefix: 'edit', value: 'Personal Info' }, 'edit-personal-info'],
  [{ value: '  Hello   World  ' }, 'hello-world'],
  // non-alphanumeric characters stripped
  [{ value: 'a!b@c' }, 'abc'],
  // alphanumeric tokens preserved — regression: remeda's toKebabCase
  // split letter<->digit boundaries ("e2e" -> "e-2-e")
  [{ value: 'e2e' }, 'e2e'],
  [{ value: 'client v2' }, 'client-v2'],
  // digit-only values preserved
  [{ value: '123' }, '123'],
];

describe('toTestId', () => {
  testCases.forEach(([props, expected]) => {
    it(`should return "${expected}" for ${JSON.stringify(props)}`, () => {
      expect(toTestId(props)).toBe(expected);
    });
  });

  describe('empty or missing value', () => {
    it('returns "" for null', () => {
      expect(toTestId({ value: null })).toBe('');
    });

    it('returns "" for undefined', () => {
      expect(toTestId({ value: undefined })).toBe('');
    });

    it('returns "" for empty string', () => {
      expect(toTestId({ value: '' })).toBe('');
    });
  });
});
