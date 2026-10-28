/**
 * Parsing helpers for the audit log's untyped `fieldChanges` JSON.
 *
 * The backend emits two shapes:
 *   - scalar change:  { "field": [old, new] }
 *   - multi-value:    { "field": [[removed...], [added...]] }
 *
 * Keys are display names (`start time`, not `start_time`), and every entry is a
 * real change: unchanged identity for synthesized events arrives separately as
 * `AuditEvent.context`, never in `fieldChanges`.
 */

import { sanitizeHtml } from '@monorepo/react/shared';
import {
  enumDisplayAccessibilityChoices,
  enumDisplayDemographics,
  enumDisplayEntryRequirementChoices,
  enumDisplayExitPolicyChoices,
  enumDisplayFunderChoices,
  enumDisplayParkingChoices,
  enumDisplayPetChoices,
  enumDisplayReferralRequirementChoices,
  enumDisplayRoomStyles,
  enumDisplayShelterChoices,
  enumDisplayShelterProgramChoices,
  enumDisplaySpecialSituationRestrictionChoices,
  enumDisplayStorageChoices,
  enumDisplayVaccinationRequirementChoices,
} from '@monorepo/react/shelter';

export type AuditScalarChange = {
  kind: 'scalar';
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
};

export type AuditMultiChange = {
  kind: 'multi';
  field: string;
  label: string;
  removed: unknown[];
  added: unknown[];
};

export type AuditChange = AuditScalarChange | AuditMultiChange;

const ACTION_VERBS = new Set(['add', 'remove', 'update', 'status_change']);

/** Longest rendered value; longer ones are truncated (see `truncateValue`). */
export const MAX_VALUE_LENGTH = 140;

const TEXT_BLOCK_TAGS = [
  'p',
  'div',
  'br',
  'li',
  'ul',
  'ol',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'tr',
  'td',
  'th',
];

/** Blocks that should separate adjacent text when the markup is flattened. */
const TEXT_BLOCK_ELEMENTS = TEXT_BLOCK_TAGS.join(',');

/**
 * Rich-text fields (a shelter description or notes) are stored as HTML. The log
 * renders plain text, so the shared sanitizer keeps only block-level text
 * containers (scripts and unknown markup are discarded) and the browser's HTML
 * parser then flattens that safe subtree: entities are decoded and block
 * boundaries become spaces so paragraphs do not run together.
 *
 * React escapes the result, so no HTML is injected. The no-DOM fallback uses
 * the sanitizer's tag-free text form, which is likewise rendered as text.
 */
export function stripHtmlToText(value: string): string {
  const safeHtml = sanitizeHtml(value, {
    allowedTags: TEXT_BLOCK_TAGS,
    allowedAttributes: {},
  });

  if (typeof DOMParser === 'undefined') {
    return sanitizeHtml(safeHtml);
  }

  const doc = new DOMParser().parseFromString(safeHtml, 'text/html');

  doc.body.querySelectorAll(TEXT_BLOCK_ELEMENTS).forEach((element) => {
    element.append(' ');
  });

  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Shorten a rendered value for inline display; the full value stays in `title`. */
export function truncateValue(
  value: string,
  maxLength = MAX_VALUE_LENGTH,
): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}\u2026`;
}

/**
 * Fields hidden from every event, as display names.
 *
 * Defence in depth only: ``_scalar_changes`` already drops the pk and the
 * DB-generated columns server-side (§13) — the pk through its ``hidden`` set,
 * the generated totals through ``_generated_fields`` — so they never reach a
 * payload today. The log keeps rendering sanely if that projection ever loosens.
 *
 * The pk's display name is ``ID`` (Django's auto-pk ``verbose_name``); keys are
 * matched case-insensitively so either spelling works.
 */
const HIDDEN_FIELDS = ['id', 'start cycle minutes', 'duration minutes'];

const SCHEDULE_ACTION_PREFIX = 'shelter.schedule';

export type ParseFieldChangesOptions = {
  /** Display names dropped when both the old and new value are absent or `false`. */
  dropWhenBothFalsey?: readonly string[];
};

/**
 * Display rules keyed off the event's action.
 *
 * A schedule create/delete carries every populated column, including the
 * `is_exception` default as ``[null, false]`` — that is not a change, so drop it.
 */
export function displayOptionsForAction(
  action?: string,
): ParseFieldChangesOptions {
  if (action?.startsWith(SCHEDULE_ACTION_PREFIX)) {
    return { dropWhenBothFalsey: ['is exception'] };
  }

  return {};
}

/**
 * True when a `field_changes` key names *field*.
 *
 * A key is the display name (`is exception`) when the row is the log's own
 * object, or qualified with the owner and id (`Schedule 209 is exception`) when
 * it is a related one — the action-level rollup merges both kinds into one map
 * (§13), and the collapsed card renders it. Matching the suffix is what makes a
 * rule fire on both shapes.
 */
function matchesField(key: string, field: string): boolean {
  const normalizedKey = key.toLowerCase();
  const normalizedField = field.toLowerCase();

  return (
    normalizedKey === normalizedField ||
    normalizedKey.endsWith(` ${normalizedField}`)
  );
}

/**
 * Absent (`null`/`undefined`) or explicitly `false`.
 *
 * Deliberately not "falsey": `0` and `''` are real values, and a rule that
 * silently dropped them would hide a genuine change.
 */
function isAbsentOrFalse(value: unknown): boolean {
  return value === null || value === undefined || value === false;
}

/** `exit_policy` -> `Exit Policy` */
export function humanizeFieldName(field: string): string {
  return field
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * `shelter.demographic.add` -> `Shelter Demographic`
 * The trailing verb is dropped: the kind badge already conveys add/remove/update.
 */
export function humanizeAction(action: string): string {
  const parts = action.split('.');
  const last = parts[parts.length - 1];
  const subject = ACTION_VERBS.has(last) ? parts.slice(0, -1) : parts;
  const label = subject.map(humanizeFieldName).join(' ').trim();

  return label || humanizeFieldName(action);
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '\u2014';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    const text = stripHtmlToText(value);

    return text || '\u2014';
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(formatValue).join(', ') : '\u2014';
  }
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

type ValueLabels = Readonly<Record<string, string>>;

/** Keep the typed enum maps assignable to one lookup table. */
const asValueLabels = (labels: object): ValueLabels => labels as ValueLabels;

/**
 * Field-keyed labels for related-choice values (M2M rows such as Storage and
 * Parking). The API sends the stored code (``shared_storage``); the labels are
 * the same user-facing copy used by the shelter forms.
 */
const FIELD_VALUE_LABELS: Readonly<Record<string, ValueLabels>> = {
  accessibility: asValueLabels(enumDisplayAccessibilityChoices),
  demographics: asValueLabels(enumDisplayDemographics),
  entryrequirements: asValueLabels(enumDisplayEntryRequirementChoices),
  exitpolicy: asValueLabels(enumDisplayExitPolicyChoices),
  funder: asValueLabels(enumDisplayFunderChoices),
  parking: asValueLabels(enumDisplayParkingChoices),
  pets: asValueLabels(enumDisplayPetChoices),
  referralrequirements: asValueLabels(enumDisplayReferralRequirementChoices),
  roomstyles: asValueLabels(enumDisplayRoomStyles),
  shelterprograms: asValueLabels(enumDisplayShelterProgramChoices),
  sheltertypes: asValueLabels(enumDisplayShelterChoices),
  specialsituationrestrictions: asValueLabels(
    enumDisplaySpecialSituationRestrictionChoices,
  ),
  storage: asValueLabels(enumDisplayStorageChoices),
  vaccinationrequirements: asValueLabels(
    enumDisplayVaccinationRequirementChoices,
  ),
};

const normalizeField = (field: string): string =>
  field.toLowerCase().replace(/[^a-z0-9]/g, '');

const normalizeValue = (value: string): string =>
  value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

/**
 * Format a value with the display labels for its field, falling back to the
 * raw value formatter for unknown fields and plain values.
 */
export function formatFieldValue(field: string, value: unknown): string {
  const labels = FIELD_VALUE_LABELS[normalizeField(field)];

  if (labels) {
    if (Array.isArray(value)) {
      return value.length > 0
        ? value.map((item) => formatFieldValue(field, item)).join(', ')
        : '\u2014';
    }

    if (typeof value === 'string') {
      const label = labels[normalizeValue(value)];

      if (label) {
        return label;
      }
    }
  }

  return formatValue(value);
}

function isArrayPair(value: unknown): value is [unknown[], unknown[]] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Array.isArray(value[0]) &&
    Array.isArray(value[1])
  );
}

/**
 * Parse the untyped `field_changes` JSON into renderable changes.
 *
 * Keys arrive as display names (`start time`), qualified with the owner and id
 * when the row belongs to another object (`Schedule 209 start time`). *options*
 * carries the action-specific display rules (`displayOptionsForAction`).
 */
export function parseFieldChanges(
  value: unknown,
  options: ParseFieldChangesOptions = {},
): AuditChange[] {
  const { dropWhenBothFalsey = [] } = options;

  const parsed: AuditChange[] = [];

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [field, raw] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (HIDDEN_FIELDS.some((hidden) => matchesField(field, hidden))) {
        continue;
      }

      const label = humanizeFieldName(field);

      if (isArrayPair(raw)) {
        const [removed, added] = raw;

        if (removed.length === 0 && added.length === 0) {
          continue;
        }

        parsed.push({ kind: 'multi', field, label, removed, added });
        continue;
      }

      const [oldValue, newValue] = Array.isArray(raw) ? raw : [undefined, raw];

      if (
        dropWhenBothFalsey.some((dropped) => matchesField(field, dropped)) &&
        isAbsentOrFalse(oldValue) &&
        isAbsentOrFalse(newValue)
      ) {
        continue;
      }

      // Only surface fields the write actually changed.
      if (oldValue === newValue) {
        continue;
      }

      parsed.push({ kind: 'scalar', field, label, oldValue, newValue });
    }
  }

  return parsed;
}

/** The event action that drives display options for an action's merged changes. */
export function subjectActionFor(action: {
  events: ReadonlyArray<{ action: string }>;
}): string | undefined {
  return action.events.find((event) =>
    event.action.startsWith(SCHEDULE_ACTION_PREFIX),
  )?.action;
}
