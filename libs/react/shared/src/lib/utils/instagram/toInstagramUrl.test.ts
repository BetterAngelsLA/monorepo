import { toInstagramUrl } from './toInstagramUrl';

const IG_BASE_URL = 'https://instagram.com';

/** `[hrefOrHandle, expected]` */
const validCases: [string | null | undefined, string | null][] = [
  ['hello', `${IG_BASE_URL}/hello`],
  ['hello.angels_1', `${IG_BASE_URL}/hello.angels_1`],
  // DEV-2633: the reported case — a dotted handle that is also a valid FQDN
  ['better.angels', `${IG_BASE_URL}/better.angels`],
  // dotted values are indistinguishable from domains, so they're read as handles
  ['example.com', `${IG_BASE_URL}/example.com`],
  ['www.google.com', `${IG_BASE_URL}/www.google.com`], // accepted trade-off
  ['@hello', `${IG_BASE_URL}/hello`],
  ['  @hello  ', `${IG_BASE_URL}/hello`],
  ['https://www.instagram.com/hello/', `${IG_BASE_URL}/hello`],
  ['http://instagram.com/hello', `${IG_BASE_URL}/hello`],
  ['instagram.com/hello', `${IG_BASE_URL}/hello`],
  ['https://instagram.com/p/ABC123', `${IG_BASE_URL}/p/ABC123`],
  // legacy `instagr.am` domain valid
  ['http://instagr.am/hello', `${IG_BASE_URL}/hello`],
  // schemes are case-insensitive
  ['HTTP://instagram.com/hello', `${IG_BASE_URL}/hello`],
  ['HTTPS://www.instagram.com/hello/', `${IG_BASE_URL}/hello`],
  ['hTtPs://instagram.com/p/ABC123', `${IG_BASE_URL}/p/ABC123`],
  ['HTTPS://INSTAGRAM.com/p/ABC123', `${IG_BASE_URL}/p/ABC123`],
];

const invalidCases: [string | null | undefined, string | null][] = [
  [undefined, null],
  [null, null],
  ['   ', null],
  ['@', null],
  ['@not a handle!', null],
  // all-dot values pass the handle regex but normalize to Instagram's home page
  ['.', null],
  ['..', null],
  ['@.', null],
  ['instagram.com/.', null],
  ['https://instagram.com/..', null],
  // 32 char limit
  ['a'.repeat(31), null],
  ['https://instagram.com', null],
  ['instagram.com/', null],
  // a non-Instagram URL is not an Instagram link
  ['https://example.com/hello', null],
  ['https://facebook.com/hello', null],
];

describe('toInstagramUrl', () => {
  // it.each(cases)('%o -> %s', (hrefOrHandle, expected) => {
  //   expect(toInstagramUrl(hrefOrHandle)).toBe(expected);
  // });
  describe('valid', () => {
    it.each(validCases)('%o -> %s', (hrefOrHandle, expected) => {
      expect(toInstagramUrl(hrefOrHandle)).toBe(expected);
    });
  });

  describe('invalid', () => {
    it.each(invalidCases)('%o -> %s', (hrefOrHandle, expected) => {
      expect(toInstagramUrl(hrefOrHandle)).toBe(expected);
    });
  });
});
