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

/**
 * Fields hidden from every event. `id` churns on full-replacement saves (the
 * row is deleted and re-created), and the two generated interval columns are
 * derived from `day`/`start_time`/`end_time`, so they add no signal.
 */
const HIDDEN_FIELDS = new Set([
  'id',
  'start_cycle_minutes',
  'start cycle minutes',
  'duration_minutes',
  'duration minutes',
]);

const SCHEDULE_ACTION_PREFIX = 'shelter.schedule';

export type ParseFieldChangesOptions = {
  /** Fields dropped when both the old and new values are falsey. */
  dropWhenBothFalsey?: readonly string[];
};

/**
 * Display rules keyed off the event's action.
 *
 * A schedule create/delete carries every populated column, including the
 * `is_exception` default as ``[null, false]`` — that is not a change, so drop it.
 * The backend sends the field under its display name; the raw name is kept too so
 * the rule survives either keying.
 */
export function displayOptionsForAction(
  action?: string,
): ParseFieldChangesOptions {
  if (action?.startsWith(SCHEDULE_ACTION_PREFIX)) {
    return { dropWhenBothFalsey: ['is_exception', 'is exception'] };
  }

  return {};
}

function isFalsey(value: unknown): boolean {
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
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
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
      if (HIDDEN_FIELDS.has(field)) {
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
        dropWhenBothFalsey.includes(field) &&
        isFalsey(oldValue) &&
        isFalsey(newValue)
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

type RenderableAction = {
  truncated?: boolean;
  fieldChanges?: unknown;
  events: ReadonlyArray<{
    action: string;
    summary?: string | null;
    fieldChanges?: unknown;
  }>;
};

function rendersChanges(value: unknown, action?: string): boolean {
  return parseFieldChanges(value, displayOptionsForAction(action)).length > 0;
}

/**
 * Whether an action has anything to show.
 *
 * Netting can leave an action with no renderable content (an unchanged
 * schedule save leaves only a no-op `shelter.update` whose changes are
 * mechanical), so the list hides those entries instead of rendering an empty
 * card. A `null` event diff is kept: it means "no diff base", not "no change".
 */
export function hasRenderableContent(action: RenderableAction): boolean {
  if (rendersChanges(action.fieldChanges, subjectActionFor(action))) {
    return true;
  }

  if (action.truncated) {
    return true;
  }

  return action.events.some(
    (event) =>
      Boolean(event.summary) ||
      event.fieldChanges === null ||
      rendersChanges(event.fieldChanges, event.action),
  );
}
