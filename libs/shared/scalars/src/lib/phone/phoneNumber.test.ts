import type { PhoneNumberString } from '../branded';
import {
  formatPhoneNumber,
  toPhoneDialString,
  toPhoneParts,
} from './phoneNumber';

const asScalar = (value: unknown) => value as PhoneNumberString;

describe('toPhoneParts', () => {
  it.each([
    ['2223334444'],
    ['  2223334444  '],
    ['222-333-4444'],
    ['222 333 4444'],
    ['(222) 333-4444'],
  ])('formats the national number %s', (input) => {
    expect(toPhoneParts(asScalar(input))).toEqual({
      formatted: '(222) 333-4444',
      extension: undefined,
      display: '(222) 333-4444',
      dial: '2223334444',
    });
  });

  it.each([['2223334444x555'], ['2223334444 x 555']])(
    'separates the extension in %s',
    (input) => {
      expect(toPhoneParts(asScalar(input))).toEqual({
        formatted: '(222) 333-4444',
        extension: '555',
        display: '(222) 333-4444 ext. 555',
        dial: '2223334444,555',
      });
    },
  );

  it('keeps the country code out of the display form', () => {
    // The API strips it, but a value that still carries one must not double up.
    expect(toPhoneParts(asScalar('+12223334444')).formatted).toBe(
      '(222) 333-4444',
    );
  });

  it.each([[null], [undefined], ['']])(
    'returns empty parts for %s',
    (input) => {
      expect(toPhoneParts(asScalar(input))).toEqual({
        formatted: '',
        display: '',
        dial: '',
      });
    },
  );

  it('hands back input the parser rejects, with nothing to dial', () => {
    expect(toPhoneParts(asScalar('abc'))).toEqual({
      formatted: 'abc',
      display: 'abc',
      dial: '',
    });
  });

  it.each([
    ['5551234', '5551234', '5551234'],
    ['911', '911', '911'],
    ['2223334444', '(222) 333-4444', '2223334444'],
  ])(
    'still formats and dials %s, which the metadata will not vouch for',
    (input, formatted, dial) => {
      // A seven-digit local number, an N11 code and an unallocated area code
      // are all isPossible() === false, and all have to work.
      expect(toPhoneParts(asScalar(input))).toEqual({
        formatted,
        extension: undefined,
        display: formatted,
        dial,
      });
    },
  );

  it('agrees with itself about where the extension ends, even on junk', () => {
    // The display and the dial string come from one parse, so they cannot
    // disagree: showing "123 ext. 45" while dialling 12345 was the old bug.
    expect(toPhoneParts(asScalar('123x45'))).toEqual({
      formatted: '123',
      extension: '45',
      display: '123 ext. 45',
      dial: '123,45',
    });
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

  it('shows unparseable input rather than dropping it', () => {
    expect(formatPhoneNumber(asScalar('abc'))).toBe('abc');
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

  it('matches the extension boundary the display form uses', () => {
    const { formatted, extension, dial } = toPhoneParts(
      asScalar('2135551234x22'),
    );

    expect(formatted).toBe('(213) 555-1234');
    expect(extension).toBe('22');
    expect(dial).toBe('2135551234,22');
    expect(toPhoneDialString(asScalar('2135551234x22'))).toBe(dial);
  });
});
