import {
  addMonths,
  format,
  isSameMonth,
  isValid,
  parse,
  startOfMonth,
} from 'date-fns';
import type { RdpDateRange } from './Calendar';
import type { DateRange } from './types';

export const DATE_FORMAT = 'MM/dd/yyyy';
const FIELD_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;
const MIN_YEAR = 1900;

export const formatDate = (date: Date) => format(date, DATE_FORMAT);

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
  committed?: DateRange
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

  return { from, to, fromError: false, toError: false, valid: true, next, changed };
}
