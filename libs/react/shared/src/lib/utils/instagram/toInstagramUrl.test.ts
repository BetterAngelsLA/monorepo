import { toInstagramUrl } from './toInstagramUrl';

const IG_BASE_URL = 'https://instagram.com';

/** `[hrefOrHandle, expected]` */
const cases: [string | null | undefined, string | null][] = [
  [undefined, null],
  [null, null],
  ['   ', null],
  ['@', null],
  ['@not a handle!', null],
  ['a'.repeat(31), null],
  ['betterangels', `${IG_BASE_URL}/betterangels`],
  ['better.angels_1', `${IG_BASE_URL}/better.angels_1`],
  ['@betterangels', `${IG_BASE_URL}/betterangels`],
  ['  @betterangels  ', `${IG_BASE_URL}/betterangels`],
  ['https://www.instagram.com/betterangels/', `${IG_BASE_URL}/betterangels`],
  ['http://instagram.com/betterangels', `${IG_BASE_URL}/betterangels`],
  ['instagram.com/betterangels', `${IG_BASE_URL}/betterangels`],
  ['http://instagr.am/betterangels', `${IG_BASE_URL}/betterangels`],
  ['https://instagram.com/p/ABC123', `${IG_BASE_URL}/p/ABC123`],
  ['https://instagram.com', null],
  ['instagram.com/', null],
  // valid URL is preserved
  ['https://example.com/housing', 'https://example.com/housing'],
  ['example.com', 'https://example.com'],
];

describe('toInstagramUrl', () => {
  it.each(cases)('toInstagramUrl(%o) → %s', (hrefOrHandle, expected) => {
    expect(toInstagramUrl(hrefOrHandle)).toBe(expected);
  });
});
