/**
 * Builds a normalized testID from one or more segments.
 *
 * Each segment is lowercased, whitespace is collapsed to dashes, and anything
 * that isn't a lowercase letter, digit, or dash is dropped. This keeps tokens
 * like "e2e" and "interaction-1785966140837" intact — unlike remeda's
 * toKebabCase, which splits on letter<->digit boundaries ("e2e" -> "e-2-e").
 * Nullish/empty segments are dropped, then the rest are joined with dashes.
 *
 * @param parts Segments to normalize and join. Nullish or empty segments are
 *   omitted from the result.
 * @returns The joined, normalized testID ('' when no usable segments remain).
 */
export function toTestId(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) =>
      (part ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''),
    )
    .filter(Boolean)
    .join('-');
}
