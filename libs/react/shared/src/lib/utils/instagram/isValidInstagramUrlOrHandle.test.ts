import { isValidInstagramUrlOrHandle } from './isValidInstagramUrlOrHandle';

/** `[value, expected]` */
const cases: [string | null | undefined, boolean][] = [
  // empty is not valid; whether blank is acceptable is the caller's policy
  [undefined, false],
  [null, false],
  ['   ', false],
  ['betterangels', true],
  ['@betterangels', true],
  ['  @betterangels  ', true],
  ['instagram.com/betterangels', true],
  ['https://www.instagram.com/betterangels/', true],
  ['http://instagr.am/betterangels', true],
  ['https://instagram.com/p/ABC123', true],
  ['@not a handle!', false],
  ['a'.repeat(31), false],
  // a dotted value reads as a domain, so it is not a handle
  ['better.angels', false],
  ['https://example.com/housing', false],
  ['example.com', false],
];

describe('isValidInstagramUrlOrHandle', () => {
  it.each(cases)('%o -> %s', (value, expected) => {
    expect(isValidInstagramUrlOrHandle(value)).toBe(expected);
  });
});
