import { Text } from '../base-ui/text/text';
import { formatValue, humanizeFieldName, truncateValue } from './auditChanges';

/**
 * Fallback copy for a null context value that has a meaningful default. The
 * backend sends a null `day` for an every-day schedule rather than a label.
 */
const NULL_FALLBACKS: Record<string, string> = { day: 'Every day' };

/**
 * The rendered context line for an event, or `null` when there is nothing to
 * show.
 *
 * Synthesized events carry the unchanged identity of the thing they describe —
 * a netted schedule change's day and schedule type, e.g.
 * "Day: Monday · Schedule type: Operating Hours". This is not a change: the
 * backend keeps `fieldChanges` to real before/after pairs.
 *
 * Exported so a caller that shows one line per slot can dedupe on what the user
 * actually reads, and skip the ones that would render nothing.
 */
export function formatAuditEventContext(context: unknown): string | null {
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return null;
  }

  const parts = Object.entries(context as Record<string, unknown>).flatMap(
    ([field, value]) => {
      const label = humanizeFieldName(field);

      if (value === null || value === undefined) {
        const fallback = NULL_FALLBACKS[field];
        return fallback ? [`${label}: ${fallback}`] : [];
      }

      // Same inline cap a field change gets: the line has to stay one line.
      return [`${label}: ${truncateValue(formatValue(value))}`];
    },
  );

  return parts.length > 0 ? parts.join(' \u00b7 ') : null;
}

/**
 * Renders the unchanged identity a synthesized event carries in `context`.
 * Kept separate from the field changes because it is not a change.
 */
export function AuditEventContext({
  context,
  className,
}: {
  context: unknown;
  className?: string;
}) {
  const line = formatAuditEventContext(context);

  if (!line) {
    return null;
  }

  return (
    <Text variant="caption" textColor="text-neutral-50" className={className}>
      {line}
    </Text>
  );
}
