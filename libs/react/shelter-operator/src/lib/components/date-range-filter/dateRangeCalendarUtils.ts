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
