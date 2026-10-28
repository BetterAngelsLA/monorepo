/**
 * Normalise an optional id coming from a task draft before it is written.
 *
 * The three states mean different things to the mutation:
 * - `undefined` — the draft never carried the field (e.g. it was seeded from a
 *   query that does not select it); omit it so the column is left alone.
 * - `''` / `null` — the user cleared the select; send `null` so the column is
 *   cleared, otherwise the old value survives the save.
 * - anything else — a real id.
 */
export function toClearableId(
  value?: string | null,
): string | null | undefined {
  if (value === undefined) return undefined;

  return value || null;
}
