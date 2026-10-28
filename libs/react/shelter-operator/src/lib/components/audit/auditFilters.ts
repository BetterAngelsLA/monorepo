import { endOfDay, startOfDay } from 'date-fns';
import type { ObjectAuditLogFilters } from '../../hooks';
import {
  DEFAULT_PRESET,
  resolvePresetValue,
  type DateRange,
  type DateRangePresetValue,
} from '../date-range-filter';

/**
 * The window the activity log opens on. Deliberately the shared default rather
 * than "All Time": the label in the filter bar and the query must agree on the
 * first render, so both derive their state from this constant.
 */
export const DEFAULT_AUDIT_PRESET: DateRangePresetValue = DEFAULT_PRESET;

/**
 * A committed actor filter: one real user, or the synthetic ``System`` entry
 * (``id: null``) that selects every event with no attributed user. ``label``
 * exists only so the bar can render the choice once the search box is gone.
 */
export type AuditActorSelection = {
  id: string | null;
  label: string;
  isSystem: boolean;
};

/**
 * Derive the inclusive GraphQL bounds, plus the actor restriction, from the
 * bar's state.
 *
 * Both ends are day-aligned in the browser's timezone, the same zone the log
 * renders timestamps in (``auditTime.ts``), so a user's "last 7 days" matches
 * the days they see. ``dateFrom``/``dateTo`` are ``null`` (not ``undefined``)
 * for an open end so that "no filter" has exactly one representation.
 *
 * The actor keys are omitted rather than set to ``null`` when nothing is
 * selected: both spellings mean "unfiltered" to the server, and omitting keeps
 * the queried variable set identical to the unfiltered one.
 */
export function rangeToFilters(
  range: DateRange,
  selection: AuditActorSelection | null = null,
): ObjectAuditLogFilters {
  const filters: ObjectAuditLogFilters = {
    dateFrom: range.from ? startOfDay(range.from).toISOString() : null,
    dateTo: range.to ? endOfDay(range.to).toISOString() : null,
  };

  if (selection?.isSystem) {
    filters.systemOnly = true;
  } else if (selection?.id) {
    filters.actorId = selection.id;
  }

  return filters;
}

export type InitialAuditFilter = {
  /** The preset the bar displays as selected. */
  preset: DateRangePresetValue;
  /** The range the bar's fields show. */
  range: DateRange;
  /** The bounds the first query carries. */
  filters: ObjectAuditLogFilters;
};

/**
 * Everything the log opens with, from a single clock read: the preset, the
 * range the bar displays, and the query bounds. Splitting these into separate
 * reads lets the bar and the query drift apart across a local midnight.
 */
export function initialAuditFilter(today?: Date): InitialAuditFilter {
  const preset = DEFAULT_AUDIT_PRESET;
  const range = resolvePresetValue(preset, today);

  return { preset, range, filters: rangeToFilters(range) };
}

/**
 * True when at least one date bound is set. Drives the empty-state copy: a date
 * filter (with or without other filters) says "in the selected date range",
 * while no filter or a non-date-only filter says simply "No activity".
 */
export function hasDateBounds(filters: ObjectAuditLogFilters): boolean {
  return Boolean(filters.dateFrom || filters.dateTo);
}
