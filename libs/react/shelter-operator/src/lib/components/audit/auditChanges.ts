/**
 * Parsing helpers for the audit log's untyped `fieldChanges` JSON.
 *
 * The backend emits two shapes:
 *   - scalar change:  { "field": [old, new] }
 *   - multi-value:    { "field": [[removed...], [added...]] }
 *
 * Keys are display names (`start time`, not `start_time`), and every entry is a
 * real change.
 */

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

const HTML_TAG = /<[a-z][^>]*>/i;
const HTML_BLOCK_BOUNDARY =
  /<\/(?:p|div|li|h[1-6]|tr|td|th|blockquote)>|<br\s*\/?>/gi;
const HTML_TAG_ANY = /<[^>]+>/g;
const HTML_ENTITY = /&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
};

function codePointToString(code: number): string | null {
  return Number.isFinite(code) && code >= 0 && code <= 0x10ffff
    ? String.fromCodePoint(code)
    : null;
}

function decodeHtmlEntities(value: string): string {
  return value.replace(HTML_ENTITY, (match, decimal, hex, named) => {
    if (decimal) {
      return codePointToString(Number(decimal)) ?? match;
    }
    if (hex) {
      return codePointToString(parseInt(hex, 16)) ?? match;
    }

    return NAMED_ENTITIES[String(named).toLowerCase()] ?? match;
  });
}

/**
 * Rich-text fields (a shelter description or notes) are stored as HTML. The
 * log renders text, so block boundaries become spaces and tags are dropped.
 * A string without a tag is returned untouched, so `a < b` is not markup.
 */
export function stripHtmlToText(value: string): string {
  if (!HTML_TAG.test(value)) {
    return value;
  }

  return value
    .replace(HTML_BLOCK_BOUNDARY, ' ')
    .replace(HTML_TAG_ANY, '')
    .replace(/\s+/g, ' ')
    .trim();
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
    const text = decodeHtmlEntities(stripHtmlToText(value))
      .replace(/\s+/g, ' ')
      .trim();

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

function isArrayPair(value: unknown): value is [unknown[], unknown[]] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Array.isArray(value[0]) &&
    Array.isArray(value[1])
  );
}

/**
 * NOTE: schedule-specific display curation (for example dropping the falsey
 * `is exception` default that a schedule create/delete carries) is part of the
 * activity-log readability/hardening follow-up; this branch renders every pair
 * the backend reports.
 */
export function parseFieldChanges(value: unknown): AuditChange[] {
  const parsed: AuditChange[] = [];

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [field, raw] of Object.entries(
      value as Record<string, unknown>,
    )) {
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

      // Only surface fields the write actually changed.
      if (oldValue === newValue) {
        continue;
      }

      parsed.push({ kind: 'scalar', field, label, oldValue, newValue });
    }
  }

  return parsed;
}
