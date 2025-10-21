import { toLocalCalendarDate } from './toLocalCalendarDate';

const TIMEZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/New_York',
  'Pacific/Kiritimati', // UTC+14
  'Asia/Kathmandu', // UTC+5:45
  'Australia/Lord_Howe', // UTC+10:30
];

describe('toLocalCalendarDate', () => {
  it('returns a Date for a valid yyyy-MM-dd string', () => {
    const result = toLocalCalendarDate('2026-10-21');

    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(9); // 0-indexed months
    expect(result?.getDate()).toBe(21);
  });

  it('returns undefined for invalid strings', () => {
    expect(toLocalCalendarDate('not-a-date')).toBeUndefined();
    expect(toLocalCalendarDate('2026-13-40')).toBeUndefined();
    expect(toLocalCalendarDate('')).toBeUndefined();
  });

  it('returns undefined for null, undefined, or non-string values', () => {
    expect(toLocalCalendarDate(null)).toBeUndefined();
    expect(toLocalCalendarDate(undefined)).toBeUndefined();
    expect(toLocalCalendarDate(123 as any)).toBeUndefined();
    expect(toLocalCalendarDate({} as any)).toBeUndefined();
  });

  it('creates a Date that matches the same calendar day locally', () => {
    const date = toLocalCalendarDate('2026-10-21');
    if (!date) throw new Error('Expected valid date');

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const roundTrip = `${y}-${m}-${d}`;

    expect(roundTrip).toBe('2026-10-21');
  });

  it('ignores leading/trailing whitespace in the string', () => {
    const date = toLocalCalendarDate(' 2026-10-21 ');
    expect(date).toBeInstanceOf(Date);
    expect(date?.getDate()).toBe(21);
  });

  it('rejects malformed but numeric strings', () => {
    expect(toLocalCalendarDate('20261021')).toBeUndefined();
    expect(toLocalCalendarDate('2026/10/21')).toBeUndefined();
    expect(toLocalCalendarDate('21-10-2026')).toBeUndefined();
  });

  describe('parses input format correctly', () => {
    it('parses yyyy-MM-dd correctly', () => {
      const d = toLocalCalendarDate('2026-10-21');

      expect(d?.toLocaleDateString('en-CA')).toBe('2026-10-21');
    });

    it('parses MM/dd/yyyy correctly', () => {
      const d = toLocalCalendarDate('10/21/2026', 'MM/dd/yyyy');

      expect(d?.toLocaleDateString('en-CA')).toBe('2026-10-21');
    });

    it('parses dd/MM/yyyy correctly', () => {
      const d = toLocalCalendarDate('21/10/2026', 'dd/MM/yyyy');

      expect(d?.toLocaleDateString('en-CA')).toBe('2026-10-21');
    });
  });

  describe('toLocalCalendarDate across time zones', () => {
    it('renders the same calendar day in all time zones', () => {
      const input = '2026-10-21';
      const date = toLocalCalendarDate(input);

      if (!date) throw new Error('Expected valid Date');

      const formatted = TIMEZONES.map((tz) =>
        date.toLocaleDateString('en-CA', { timeZone: tz })
      );

      // Assert all match the input day string
      formatted.forEach((f) => expect(f).toBe(input));
    });
  });
});
