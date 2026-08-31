import type { DateString, DateTimeString } from '../branded';
import { formatScalarDate, parseDateString, toDateString } from './dateString';

const asDate = (value: unknown) => value as DateString;
const asDateTime = (value: unknown) => value as DateTimeString;

describe('toDateString', () => {
  it('serializes the local calendar day, not the UTC one', () => {
    // 11pm local on the 5th is already the 6th in UTC. Serializing via
    // toISOString would send the wrong day.
    expect(toDateString(new Date(2026, 4, 5, 23, 0))).toBe('2026-05-05');
  });

  it('pads month and day', () => {
    expect(toDateString(new Date(2026, 0, 2))).toBe('2026-01-02');
  });
});

describe('parseDateString', () => {
  it('anchors a date-only value to local midnight', () => {
    const parsed = parseDateString(asDate('1990-05-05'));

    expect(parsed?.getFullYear()).toBe(1990);
    expect(parsed?.getMonth()).toBe(4);
    expect(parsed?.getDate()).toBe(5);
    expect(parsed?.getHours()).toBe(0);
  });

  it.each([[null], [undefined], [''], ['not-a-date']])(
    'returns undefined for %s rather than an invalid Date',
    (input) => {
      expect(parseDateString(asDate(input))).toBeUndefined();
    },
  );
});

describe('round trip', () => {
  it.each(['1990-05-05', '2026-01-01', '2026-12-31', '2024-02-29'])(
    'preserves the calendar day for %s',
    (value) => {
      const parsed = parseDateString(asDate(value));

      expect(parsed).toBeDefined();
      expect(toDateString(parsed as Date)).toBe(value);
    },
  );
});

describe('formatScalarDate', () => {
  it('formats a date-only scalar', () => {
    expect(formatScalarDate(asDate('2026-06-01'), 'MMM d')).toBe('Jun 1');
  });

  it('formats a datetime scalar', () => {
    expect(formatScalarDate(asDateTime('2026-06-01T18:30:00Z'), 'yyyy')).toBe(
      '2026',
    );
  });

  it.each([[null], [undefined], [''], ['nonsense']])(
    'returns an empty string for %s',
    (input) => {
      expect(formatScalarDate(asDate(input), 'MMM d')).toBe('');
    },
  );
});
