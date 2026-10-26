import {
  addMonths,
  differenceInCalendarDays,
  format,
  isSameMonth,
  isValid,
  parse,
  startOfMonth,
  subMonths,
} from 'date-fns';
import type { RdpDateRange } from './Calendar';
import type { DateRange } from './types';

export const DATE_FORMAT = 'MM/dd/yyyy';
const FIELD_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;
const MIN_YEAR = 1900;

/** Which end of the range a control is editing. */
export type RangeEndpoint = 'from' | 'to';

/**
 * Resolve a day click against an already-complete range.
 *
 * react-day-picker moves the end endpoint for any click after the start, so a
 * click near the start of a completed range would otherwise collapse it from the
 * wrong side. Instead:
 *
 * - a click beyond either edge extends that edge;
 * - a click *inside* the range moves the endpoint of the calendar it came from,
 *   so the "from" calendar only ever edits the start date and the "to" calendar
 *   only ever edits the end date. Resolving inside clicks by distance instead
 *   makes a click in one calendar silently rewrite the other's date whenever it
 *   happens to land nearer that edge;
 * - when no endpoint is supplied (single calendar), fall back to the nearer edge.
 */
export function resolveRangeSelection(
  selected: RdpDateRange,
  date: Date,
  endpoint?: RangeEndpoint,
): RdpDateRange {
  const { from, to } = selected;
  if (!from || !to) return { from, to };

  if (differenceInCalendarDays(date, from) < 0) return { from: date, to };
  if (differenceInCalendarDays(date, to) > 0) return { from, to: date };

  if (endpoint === 'from') return { from: date, to };
  if (endpoint === 'to') return { from, to: date };

  const distanceToStart = Math.abs(differenceInCalendarDays(date, from));
  const distanceToEnd = Math.abs(differenceInCalendarDays(date, to));
  return distanceToStart < distanceToEnd
    ? { from: date, to }
    : { from, to: date };
}

export const formatDate = (date: Date) => format(date, DATE_FORMAT);

export function maskDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  if (digits.length > 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export function coupleMonths(
  anchor: Date,
  other: Date,
  edge: 'left' | 'right',
): Date {
  const a = startOfMonth(anchor);
  const o = startOfMonth(other);
  if (edge === 'left') {
    return a.getTime() >= o.getTime() ? addMonths(a, 1) : o;
  }
  return a.getTime() <= o.getTime() ? subMonths(a, 1) : o;
}

export function toRdp(range?: DateRange): RdpDateRange | undefined {
  if (!range?.from) return undefined;
  return { from: range.from, to: range.to ?? undefined };
}

export function toDomain(range?: RdpDateRange): DateRange {
  return { from: range?.from ?? null, to: range?.to ?? null };
}

export function parseField(text: string): Date | null {
  const trimmed = text.trim();
  if (!FIELD_PATTERN.test(trimmed)) return null;
  const parsed = parse(trimmed, DATE_FORMAT, new Date());
  if (!isValid(parsed) || parsed.getFullYear() < MIN_YEAR) return null;
  return parsed;
}

export function defaultMonths(range?: RdpDateRange): [Date, Date] {
  const left = startOfMonth(range?.from ?? new Date());
  const right =
    range?.to && !isSameMonth(range.to, left)
      ? startOfMonth(range.to)
      : addMonths(left, 1);
  return [left, right];
}

export interface FieldCommitResult {
  from: Date | null;
  to: Date | null;
  fromError: boolean;
  toError: boolean;
  valid: boolean;
  next?: RdpDateRange;
  changed: boolean;
}

export function computeFieldCommit(
  fromText: string,
  toText: string,
  committed?: DateRange,
): FieldCommitResult {
  const from = parseField(fromText);
  const to = parseField(toText);
  const fromBad = fromText.trim() !== '' && !from;
  const toBad = toText.trim() !== '' && !to;
  const orderBad = !!from && !!to && from > to;
  const fromError = fromBad || orderBad;
  const toError = toBad || orderBad;

  if (fromError || toError) {
    return { from, to, fromError, toError, valid: false, changed: false };
  }

  let next: RdpDateRange | undefined;
  if (from && to) next = { from, to };
  else if (from) next = { from, to: undefined };
  else if (to) next = { from: to, to: undefined };

  const prev = toRdp(committed);
  const changed =
    (next?.from?.getTime() ?? null) !== (prev?.from?.getTime() ?? null) ||
    (next?.to?.getTime() ?? null) !== (prev?.to?.getTime() ?? null);

  return {
    from,
    to,
    fromError: false,
    toError: false,
    valid: true,
    next,
    changed,
  };
}
