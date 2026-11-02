import { endOfDay, startOfDay } from 'date-fns';
import type { ObjectAuditLogFilters } from '../../hooks';
import {
  DEFAULT_PRESET,
  resolvePreset,
  type DateRange,
  type DateRangePreset,
} from '../date-range-filter';

/** A shared preset, plus the audit log's explicit "no range" entry. */
export type AuditDatePreset = 'ALL' | DateRangePreset;

/**
 * The window the activity log opens on. Deliberately the shared default rather
 * than "All time": the label in the filter bar and the query must agree on the
 * first render, so both derive their state from this constant.
 */
export const DEFAULT_AUDIT_PRESET: AuditDatePreset = DEFAULT_PRESET;

/**
 * The concrete range a preset stands for. ``CUSTOM`` is never picked from the
 * dropdown (it is only a label for a range chosen in the calendar); should it
 * arrive here, it resolves to no bounds like ``ALL``.
 */
export function presetRange(preset: AuditDatePreset, today?: Date): DateRange {
  if (preset === 'ALL') {
    return { from: null, to: null };
  }

  return resolvePreset(preset, today);
}

/**
 * Derive the inclusive GraphQL bounds from a picked range.
 *
 * Both ends are day-aligned in the browser's timezone, the same zone the log
 * renders timestamps in (``auditTime.ts``), so a user's "last 7 days" matches
 * the days they see. ``dateFrom``/``dateTo`` are ``null`` (not ``undefined``)
 * for an open end so that "no filter" has exactly one representation.
 */
export function rangeToFilters(range: DateRange): ObjectAuditLogFilters {
  return {
    dateFrom: range.from ? startOfDay(range.from).toISOString() : null,
    dateTo: range.to ? endOfDay(range.to).toISOString() : null,
  };
}

/**
 * Filters the log opens with; ``ObjectAuditLog`` seeds its state from this so
 * the first query already carries the range the bar displays.
 */
export function initialAuditFilters(): ObjectAuditLogFilters {
  return rangeToFilters(presetRange(DEFAULT_AUDIT_PRESET));
}

/** True when at least one date bound is set (an "All time" view is unfiltered). */
export function hasDateFilters(filters: ObjectAuditLogFilters): boolean {
  return Boolean(filters.dateFrom || filters.dateTo);
}
