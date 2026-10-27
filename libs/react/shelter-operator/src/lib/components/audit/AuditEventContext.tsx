import { Text } from '../base-ui/text/text';
import { formatValue, humanizeFieldName } from './auditChanges';

/**
 * Fallback copy for a null context value that has a meaningful default. The
 * backend sends a null `day` for an every-day schedule rather than a label.
 */
const NULL_FALLBACKS: Record<string, string> = { day: 'Every day' };

/**
 * Renders the unchanged identity a synthesized event carries in `context` —
 * a netted schedule change's day and schedule type, e.g.
 * "Day: Monday · Schedule type: Operating Hours".
 *
 * Kept separate from the field changes because it is not a change: the backend
 * restricts `fieldChanges` to real before/after pairs.
 */
export function AuditEventContext({
  context,
  className,
}: {
  context: unknown;
  className?: string;
}) {
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

      return [`${label}: ${formatValue(value)}`];
    },
  );

  if (parts.length === 0) {
    return null;
  }

  return (
    <Text variant="caption" textColor="text-neutral-50" className={className}>
      {parts.join(' \u00b7 ')}
    </Text>
  );
}
