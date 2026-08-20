import type { PhoneNumberString } from '../branded';
import {
  formatPhoneNumber,
  parsePhoneNumber,
  toPhoneDialString,
} from './phoneNumber';

const asScalar = (value: unknown) => value as PhoneNumberString;

describe('parsePhoneNumber', () => {
  it.each([
    ['2223334444', '(222) 333-4444'],
    ['  2223334444  ', '(222) 333-4444'],
    ['222-333-4444', '(222) 333-4444'],
    ['222 333 4444', '(222) 333-4444'],
    ['(222) 333-4444', '(222) 333-4444'],
  ])('formats the national number %s', (input, expected) => {
    expect(parsePhoneNumber(asScalar(input))).toEqual({
      formatted: expected,
      extension: undefined,
    });
  });

  it.each([
    ['2223334444x555', '555'],
    ['2223334444 x 555', '555'],
  ])('separates the extension in %s', (input, extension) => {
    expect(parsePhoneNumber(asScalar(input))).toEqual({
      formatted: '(222) 333-4444',
      extension,
    });
  });

  it('keeps the country code out of the display form', () => {
    // The API strips it, but a value that still carries one must not double up.
    expect(parsePhoneNumber(asScalar('+12223334444')).formatted).toBe(
      '(222) 333-4444',
    );
  });

  it.each([
    ['123', '123'],
    ['123-456', '123-456'],
    ['abc', 'abc'],
  ])('returns %s unchanged when it cannot be parsed', (input, expected) => {
    expect(parsePhoneNumber(asScalar(input)).formatted).toBe(expected);
  });

  it.each([[null], [undefined], ['']])(
    'returns an empty string for %s',
    (input) => {
      expect(parsePhoneNumber(asScalar(input))).toEqual({ formatted: '' });
    },
  );

  it('does not split unrecognised input into number and extension', () => {
    // The metadata will not vouch for "123", so the value is shown as given
    // rather than presented as a number with an extension.
    expect(parsePhoneNumber(asScalar('123x45'))).toEqual({
      formatted: '123x45',
    });
  });

  it('formats a possible number the metadata has not allocated', () => {
    // 222 is not an assigned area code; it still has to display.
    expect(parsePhoneNumber(asScalar('2223334444')).formatted).toBe(
      '(222) 333-4444',
    );
  });
});

describe('formatPhoneNumber', () => {
  it('renders a single string', () => {
    expect(formatPhoneNumber(asScalar('2223334444'))).toBe('(222) 333-4444');
  });

  it('appends the extension', () => {
    expect(formatPhoneNumber(asScalar('2223334444x555'))).toBe(
      '(222) 333-4444 ext. 555',
    );
  });

  it('returns an empty string for no value', () => {
    expect(formatPhoneNumber(asScalar(undefined))).toBe('');
  });

  it('agrees with parsePhoneNumber on unrecognised input', () => {
    expect(formatPhoneNumber(asScalar('123x45'))).toBe('123x45');
  });
});

describe('toPhoneDialString', () => {
  it.each([
    ['2223334444', '2223334444'],
    ['(222) 333-4444', '2223334444'],
    ['2223334444x555', '2223334444,555'],
  ])('turns %s into dialable digits', (input, expected) => {
    expect(toPhoneDialString(asScalar(input))).toBe(expected);
  });

  it.each([[null], [undefined], [''], ['abc'], ['abcx1']])(
    'returns an empty string for %s',
    (input) => {
      expect(toPhoneDialString(asScalar(input))).toBe('');
    },
  );

  it('still separates an extension the number cannot be validated against', () => {
    // Dialling is a different concern from display: the extension is kept out
    // of the digits so the dialer pauses in the right place.
    expect(toPhoneDialString(asScalar('123x45'))).toBe('123,45');
  });
});
