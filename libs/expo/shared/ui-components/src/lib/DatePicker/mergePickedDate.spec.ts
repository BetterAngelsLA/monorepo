import { describe, expect, it } from 'vitest';

import { mergePickedDate } from './mergePickedDate';

const DATE_FORMAT = 'yyyy-MM-dd';
const TIME_FORMAT = 'HH:mm';

// A fixed "now" so the assertions do not depend on the clock.
const NOW = new Date(2024, 4, 15, 13, 45, 30); // 15 May 2024, 13:45:30

describe('mergePickedDate', () => {
  it('keeps the current clock time when only the date is picked', () => {
    // The point of the rule: the native picker is seeded with `value || new
    // Date()` and passes its Date straight through, so a date-only pick carries
    // the time it was seeded with. Midnight is *not* the behaviour.
    const result = mergePickedDate(
      '2024-06-01',
      'date',
      undefined,
      NOW,
      DATE_FORMAT,
    );

    // Seconds and milliseconds are dropped, though — the native picker does not
    // offer them for a date.
    expect(result).toEqual(new Date(2024, 5, 1, 13, 45));
  });

  it('keeps the picked date when only the time changes', () => {
    const value = new Date(2024, 5, 1, 9, 30);

    const result = mergePickedDate('17:05', 'time', value, NOW, TIME_FORMAT);

    expect(result).toEqual(new Date(2024, 5, 1, 17, 5));
  });

  it('clears the seconds when the date changes', () => {
    const value = new Date(2024, 5, 1, 9, 30, 45);

    const result = mergePickedDate(
      '2024-06-02',
      'date',
      value,
      NOW,
      DATE_FORMAT,
    );

    expect(result?.getSeconds()).toBe(0);
    expect(result).toEqual(new Date(2024, 5, 2, 9, 30));
  });

  it('replaces the whole value from a cleared field, date half', () => {
    const result = mergePickedDate(
      '2024-06-01',
      'date',
      undefined,
      NOW,
      DATE_FORMAT,
    );

    expect(result?.getFullYear()).toBe(2024);
    expect(result?.getMonth()).toBe(5);
    expect(result?.getDate()).toBe(1);
  });

  it('preserves the clock time on a time-only merge with no prior value', () => {
    // `mode === 'time'` keeps the *date* half of the base, which is "now".
    const result = mergePickedDate(
      '08:15',
      'time',
      undefined,
      NOW,
      TIME_FORMAT,
    );

    expect(result).toEqual(new Date(2024, 4, 15, 8, 15));
  });

  it('returns null for an empty value rather than wiping the field', () => {
    // Clearing the native control must not silently clear a required value; the
    // numeric variant owns clear-button behaviour via `onDelete`.
    expect(mergePickedDate('', 'date', NOW, NOW, DATE_FORMAT)).toBeNull();
    expect(mergePickedDate('', 'time', NOW, NOW, TIME_FORMAT)).toBeNull();
  });

  it('returns null for an unparseable value', () => {
    expect(
      mergePickedDate('not-a-date', 'date', NOW, NOW, DATE_FORMAT),
    ).toBeNull();
  });

  it('ignores an invalid prior value and falls back to now', () => {
    const invalid = new Date('nonsense');

    const result = mergePickedDate(
      '2024-06-01',
      'date',
      invalid,
      NOW,
      DATE_FORMAT,
    );

    expect(result).toEqual(new Date(2024, 5, 1, 13, 45));
  });
});
