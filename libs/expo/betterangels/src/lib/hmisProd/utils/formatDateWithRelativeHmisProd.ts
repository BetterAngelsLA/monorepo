import { formatScalarDate } from '@monorepo/shared/scalars';
import { humanizeDateHmisProd } from './humanizeDateHmisProd';

/**
 * Clarity date rendered the way the feature's cards show dates:
 * `MM/dd/yyyy (relative)`, e.g. `09/28/2026 (2 days ago)`. Falls back to the
 * raw value when the date isn't parseable.
 *
 * `now` is injectable for tests.
 */
export function formatDateWithRelativeHmisProd(
  value: string,
  now: Date = new Date(),
): string {
  const date = formatScalarDate(value, 'MM/dd/yyyy');

  if (!date) {
    return value;
  }

  const relative = humanizeDateHmisProd(value, now);

  return relative ? `${date} (${relative})` : date;
}
