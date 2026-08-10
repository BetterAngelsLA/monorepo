import { describe, expect, it } from 'vitest';
import { toTestId } from './toTestId';

type TTestCase = [Parameters<typeof toTestId>[0], string];

const testCases: TTestCase[] = [
  // single segment
  [['hello'], 'hello'],
  // multiple segments joined with dashes
  [['client-card', 'e2e-test-client'], 'client-card-e2e-test-client'],
  [['John', 'Doe'], 'john-doe'],
  [
    ['note-card', 'interaction-1785966140837'],
    'note-card-interaction-1785966140837',
  ],
  // case normalization per segment
  [['tAbS'], 'tabs'],
  [['TAB', 'Interactions'], 'tab-interactions'],
  // whitespace collapsed to dashes
  [['edit', 'Personal Info'], 'edit-personal-info'],
  [['  Hello   World  '], 'hello-world'],
  // non-alphanumeric characters stripped
  [['a!b@c'], 'abc'],
  // alphanumeric tokens preserved — regression: remeda's toKebabCase
  // split letter<->digit boundaries ("e2e" -> "e-2-e")
  [['e2e'], 'e2e'],
  [['client v2'], 'client-v2'],
  // digit-only values preserved
  [['123'], '123'],
  // nullish/empty segments dropped, remaining joined
  [['a', null, 'b'], 'a-b'],
  [['edit', undefined], 'edit'],
];

describe('toTestId', () => {
  testCases.forEach(([props, expected]) => {
    it(`should return "${expected}" for ${JSON.stringify(props)}`, () => {
      expect(toTestId(props)).toBe(expected);
    });
  });

  describe('empty or missing segments', () => {
    it('returns "" for null', () => {
      expect(toTestId([null])).toBe('');
    });

    it('returns "" for undefined', () => {
      expect(toTestId([undefined])).toBe('');
    });

    it('returns "" for empty string', () => {
      expect(toTestId([''])).toBe('');
    });

    it('returns "" for an empty array', () => {
      expect(toTestId([])).toBe('');
    });
  });
});
