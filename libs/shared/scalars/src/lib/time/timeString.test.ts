import type { TimeString } from '../branded';
import { formatTimeString, fromTimeString, toTimeString } from './timeString';

const asTime = (value: unknown) => value as TimeString;

describe('toTimeString', () => {
  it.each([
    [0, '00:00:00'],
    [90, '01:30:00'],
    [1439, '23:59:00'],
    [1440, '24:00:00'],
  ])('serializes %s minutes as %s', (minutes, expected) => {
    expect(toTimeString(minutes)).toBe(expected);
  });

  it('clamps rather than wrapping past the end of the day', () => {
    expect(toTimeString(1500)).toBe('24:00:00');
    expect(toTimeString(-30)).toBe('00:00:00');
  });
});

describe('fromTimeString', () => {
  it.each([
    ['00:00:00', 0],
    ['01:30:00', 90],
    ['01:30', 90],
    ['23:59:00', 1439],
  ])('parses %s as %s minutes', (value, expected) => {
    expect(fromTimeString(asTime(value))).toBe(expected);
  });

  it.each([[null], [undefined], [''], ['abc'], ['ab:cd']])(
    'returns undefined for %s instead of NaN',
    (input) => {
      expect(fromTimeString(asTime(input))).toBeUndefined();
    },
  );
});

describe('formatTimeString', () => {
  it.each([
    ['09:05:00', '9:05 AM'],
    ['13:30:00', '1:30 PM'],
    ['00:00:00', '12:00 AM'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatTimeString(asTime(value), 'h:mm a')).toBe(expected);
  });

  it('returns the input untouched when it cannot be parsed', () => {
    expect(formatTimeString(asTime('sometime'), 'h:mm a')).toBe('sometime');
  });
});
