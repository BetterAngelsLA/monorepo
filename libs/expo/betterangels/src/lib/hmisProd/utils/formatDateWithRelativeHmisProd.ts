import { presentDateHmisProd } from './presentDateHmisProd';

/**
 * Clarity date rendered the way the feature's cards show dates:
 * `MM/dd/yyyy (relative)`, e.g. `09/28/2026 (2 days ago)`. Falls back to the
 * raw value when it isn't parseable, and drops the parenthetical when the
 * humanizer can't produce a relative label.
 *
 * `now` is injectable for tests.
 */
export function formatDateWithRelativeHmisProd(
  value: string,
  now: Date = new Date(),
): string {
  const { date, relative } = presentDateHmisProd(value, now);

  return relative ? `${date} (${relative})` : date;
}
