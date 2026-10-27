/**
 * Parsing helpers for the audit log's untyped `fieldChanges` JSON.
 *
 * The backend emits two shapes:
 *   - scalar change:  { "field": [old, new] }
 *   - multi-value:    { "field": [[removed...], [added...]] }
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
  'duration_minutes',
]);

const SCHEDULE_ACTION_PREFIX = 'shelter.schedule';

export type ParseFieldChangesOptions = {
  /** Fields always shown as context, even when unchanged. */
  pinnedFields?: readonly string[];
  /** Fallback value for a pinned field missing from the payload. */
  pinnedFallbacks?: Record<string, string>;
  /** Fields dropped when both the old and new values are falsey. */
  dropWhenBothFalsey?: readonly string[];
};

/**
 * Display rules keyed off the event's action.
 *
 * Schedule rows are saved via full replacement (delete + bulk_create), so their
 * merged `fieldChanges` carry every populated column as a no-op pair. Pinning
 * `day`/`schedule_type` keeps the row identifiable and the no-op filter in
 * `parseFieldChanges` drops the rest.
 */
export function displayOptionsForAction(
  action?: string,
): ParseFieldChangesOptions {
  if (action?.startsWith(SCHEDULE_ACTION_PREFIX)) {
    return {
      pinnedFields: ['day', 'schedule_type'],
      pinnedFallbacks: { day: 'Every day' },
      dropWhenBothFalsey: ['is_exception'],
    };
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
  const {
    pinnedFields = [],
    pinnedFallbacks = {},
    dropWhenBothFalsey = [],
  } = options;
  const pinned = new Set(pinnedFields);

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

      // Only surface fields the update actually touched; pinned context
      // fields are kept even when unchanged.
      if (!pinned.has(field) && oldValue === newValue) {
        continue;
      }

      parsed.push({ kind: 'scalar', field, label, oldValue, newValue });
    }
  }

  if (pinnedFields.length === 0) {
    return parsed;
  }

  const present = new Set(parsed.map((change) => change.field));
  const injected: AuditChange[] = pinnedFields
    .filter((field) => !present.has(field))
    .map((field) => {
      const fallback = pinnedFallbacks[field];

      return {
        kind: 'scalar',
        field,
        label: humanizeFieldName(field),
        oldValue: fallback,
        newValue: fallback,
      };
    });

  const pinnedChanges = parsed.filter((change) => pinned.has(change.field));
  const rest = parsed.filter((change) => !pinned.has(change.field));

  return [...injected, ...pinnedChanges, ...rest];
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
