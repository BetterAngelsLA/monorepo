import type { TimeString } from '../branded';
import { formatTimeString, fromTimeString, toTimeString } from './timeString';

const asTime = (value: unknown) => value as TimeString;

describe('toTimeString', () => {
  it.each([
    [0, '00:00:00'],
    [90, '01:30:00'],
    [1439, '23:59:00'],
  ])('serializes %s minutes as %s', (minutes, expected) => {
    expect(toTimeString(minutes)).toBe(expected);
  });

  it('clamps to the last minute of the day rather than emitting 24:00:00', () => {
    // Python's time.fromisoformat folds "24:00:00" to midnight, so a window
    // ending there would come back ending before it started.
    expect(toTimeString(1440)).toBe('23:59:00');
    expect(toTimeString(1500)).toBe('23:59:00');
    expect(toTimeString(-30)).toBe('00:00:00');
  });

  it('round trips through fromTimeString at the end of the day', () => {
    expect(fromTimeString(toTimeString(1440))).toBe(1439);
  });
});

describe('fromTimeString', () => {
  it.each([
    ['00:00:00', 0],
    ['01:30:00', 90],
    ['01:30', 90],
    ['23:59:00', 1439],
    ['  09:15  ', 555],
  ])('parses %s as %s minutes', (value, expected) => {
    expect(fromTimeString(asTime(value))).toBe(expected);
  });

  it.each([[null], [undefined], [''], ['abc'], ['ab:cd']])(
    'returns undefined for %s instead of NaN',
    (input) => {
      expect(fromTimeString(asTime(input))).toBeUndefined();
    },
  );

  it.each([
    ['8'],
    [':30'],
    ['12'],
    ['99:99'],
    ['12:60'],
    ['24:00:00'],
    ['25:00'],
    ['-05:00'],
    ['0x10:00'],
    ['1e2:00'],
    ['2026-05-05'],
  ])('rejects %s, which is not a time of day', (input) => {
    // Number() accepts hex and exponent notation, and nothing bounds the
    // result, so without a real pattern these all parse into a minute count.
    expect(fromTimeString(asTime(input))).toBeUndefined();
  });
});

describe('formatTimeString', () => {
  it.each([
    ['09:05:00', '9:05 AM'],
    ['13:30:00', '1:30 PM'],
    ['00:00:00', '12:00 AM'],
    ['23:59:00', '11:59 PM'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatTimeString(asTime(value), 'h:mm a')).toBe(expected);
  });

  it('returns the input untouched when it cannot be parsed', () => {
    expect(formatTimeString(asTime('sometime'), 'h:mm a')).toBe('sometime');
    expect(formatTimeString(asTime('99:99'), 'h:mm a')).toBe('99:99');
  });

  describe('in a zone that observes daylight saving', () => {
    // 2026-03-08 is the US spring-forward date: 02:00 does not exist locally,
    // so anchoring to today moves it to 03:00 and collapses two curfews onto
    // the same rendering.
    const SPRING_FORWARD = [2026, 2, 8] as const;
    const ORDINARY = [2026, 7, 20] as const;
    const FALL_BACK = [2026, 10, 1] as const;

    const originalTZ = process.env.TZ;

    beforeAll(() => {
      process.env.TZ = 'America/Los_Angeles';
    });

    afterAll(() => {
      process.env.TZ = originalTZ;
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const renderOn = (
      day: readonly [number, number, number],
      value: string,
    ) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(...day, 12));

      return formatTimeString(asTime(value), 'h:mm a');
    };

    it.each(['01:30:00', '02:00:00', '02:30:00', '03:00:00'])(
      'renders %s the same whatever today is',
      (value) => {
        const rendered = [ORDINARY, SPRING_FORWARD, FALL_BACK].map((day) =>
          renderOn(day, value),
        );

        expect(new Set(rendered).size).toBe(1);
      },
    );

    it('keeps 02:00 and 03:00 distinct on the spring-forward day', () => {
      expect(renderOn(SPRING_FORWARD, '02:00:00')).toBe('2:00 AM');
      expect(renderOn(SPRING_FORWARD, '03:00:00')).toBe('3:00 AM');
    });
  });
});
