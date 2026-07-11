import {
  computeFieldCommit,
  defaultMonths,
  formatDate,
  parseField,
  toDomain,
  toRdp,
} from './dateRangeCalendarUtils';

describe('parseField', () => {
  it('parses a fully-typed MM/DD/YYYY date', () => {
    expect(parseField('05/18/2026')).toEqual(new Date(2026, 4, 18));
  });

  it('trims surrounding whitespace', () => {
    expect(parseField('  06/20/2026  ')).toEqual(new Date(2026, 5, 20));
  });

  it('rejects partial / non-matching input', () => {
    expect(parseField('05/1')).toBeNull();
    expect(parseField('5/1/2026')).toBeNull();
    expect(parseField('2026-05-18')).toBeNull();
    expect(parseField('')).toBeNull();
  });

  it('rejects impossible dates', () => {
    expect(parseField('13/01/2026')).toBeNull();
    expect(parseField('02/30/2026')).toBeNull();
  });

  it('rejects implausible years (0000 / before 1900)', () => {
    expect(parseField('05/20/0000')).toBeNull();
    expect(parseField('05/20/1899')).toBeNull();
    expect(parseField('05/20/1900')).toEqual(new Date(1900, 4, 20));
  });
});

describe('defaultMonths', () => {
  it('uses from month on the left and to month on the right when they differ', () => {
    const [left, right] = defaultMonths({
      from: new Date(2025, 4, 18),
      to: new Date(2026, 5, 20),
    });
    expect(left).toEqual(new Date(2025, 4, 1));
    expect(right).toEqual(new Date(2026, 5, 1));
  });

  it('falls back to the month after `from` when there is no distinct `to`', () => {
    const [left, right] = defaultMonths({ from: new Date(2026, 5, 10) });
    expect(left).toEqual(new Date(2026, 5, 1));
    expect(right).toEqual(new Date(2026, 6, 1));
  });

  it('treats a same-month range as from + next month', () => {
    const [left, right] = defaultMonths({
      from: new Date(2026, 5, 3),
      to: new Date(2026, 5, 20),
    });
    expect(left).toEqual(new Date(2026, 5, 1));
    expect(right).toEqual(new Date(2026, 6, 1));
  });

  it('defaults an empty range to this month + next', () => {
    const [left, right] = defaultMonths(undefined);
    const now = new Date();
    expect(left).toEqual(new Date(now.getFullYear(), now.getMonth(), 1));
    expect(right.getMonth()).toBe((now.getMonth() + 1) % 12);
  });
});

describe('toRdp / toDomain', () => {
  it('toRdp returns undefined when there is no start', () => {
    expect(toRdp(undefined)).toBeUndefined();
    expect(toRdp({ from: null, to: null })).toBeUndefined();
  });

  it('toRdp maps a domain range to a react-day-picker range', () => {
    const from = new Date(2026, 4, 18);
    const to = new Date(2026, 5, 20);
    expect(toRdp({ from, to })).toEqual({ from, to });
    expect(toRdp({ from, to: null })).toEqual({ from, to: undefined });
  });

  it('toDomain maps back, nulling missing endpoints', () => {
    const from = new Date(2026, 4, 18);
    expect(toDomain(undefined)).toEqual({ from: null, to: null });
    expect(toDomain({ from, to: undefined })).toEqual({ from, to: null });
  });

  it('toRdp and toDomain round-trip a full range', () => {
    const range = { from: new Date(2026, 4, 18), to: new Date(2026, 5, 20) };
    expect(toDomain(toRdp(range))).toEqual(range);
  });
});

describe('formatDate', () => {
  it('formats to MM/dd/yyyy', () => {
    expect(formatDate(new Date(2026, 4, 8))).toBe('05/08/2026');
  });
});

describe('computeFieldCommit', () => {
  it('commits a valid ordered range', () => {
    const r = computeFieldCommit('05/18/2026', '06/20/2026');
    expect(r.valid).toBe(true);
    expect(r.fromError).toBe(false);
    expect(r.toError).toBe(false);
    expect(r.next).toEqual({
      from: new Date(2026, 4, 18),
      to: new Date(2026, 5, 20),
    });
    expect(r.changed).toBe(true);
  });

  it('commits a start-only range (to left undefined)', () => {
    const r = computeFieldCommit('05/18/2026', '');
    expect(r.valid).toBe(true);
    expect(r.next).toEqual({ from: new Date(2026, 4, 18), to: undefined });
  });

  it('promotes an end-only value to the start', () => {
    const r = computeFieldCommit('', '06/20/2026');
    expect(r.valid).toBe(true);
    expect(r.next).toEqual({ from: new Date(2026, 5, 20), to: undefined });
  });

  it('flags an invalid start and does not commit', () => {
    const r = computeFieldCommit('05/1', '06/20/2026');
    expect(r.valid).toBe(false);
    expect(r.fromError).toBe(true);
    expect(r.toError).toBe(false);
  });

  it('flags an impossible end date and does not commit', () => {
    const r = computeFieldCommit('05/18/2026', '02/30/2026');
    expect(r.valid).toBe(false);
    expect(r.toError).toBe(true);
  });

  it('flags an out-of-order range on both fields and does not commit', () => {
    const r = computeFieldCommit('07/15/2026', '06/20/2026');
    expect(r.valid).toBe(false);
    expect(r.fromError).toBe(true);
    expect(r.toError).toBe(true);
    expect(r.next).toBeUndefined();
  });

  it('rejects a 0000 year', () => {
    const r = computeFieldCommit('05/20/0000', '06/20/2026');
    expect(r.valid).toBe(false);
    expect(r.fromError).toBe(true);
  });

  it('treats two empty fields as a valid empty selection', () => {
    const r = computeFieldCommit('', '');
    expect(r.valid).toBe(true);
    expect(r.next).toBeUndefined();
    expect(r.changed).toBe(false);
  });

  it('reports unchanged when the typed range equals the committed value', () => {
    const committed = {
      from: new Date(2026, 4, 18),
      to: new Date(2026, 5, 20),
    };
    const r = computeFieldCommit('05/18/2026', '06/20/2026', committed);
    expect(r.valid).toBe(true);
    expect(r.changed).toBe(false);
  });

  it('reports changed when the typed range differs from the committed value', () => {
    const committed = {
      from: new Date(2026, 4, 18),
      to: new Date(2026, 5, 20),
    };
    const r = computeFieldCommit('05/18/2026', '06/21/2026', committed);
    expect(r.changed).toBe(true);
  });
});
