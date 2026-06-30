/**
 * Normalizes a URL by prepending `https://` if no `://` scheme is present.
 * Returns the original value if a scheme already exists, or `null` if empty/whitespace.
 */
export function normalizeUrlScheme(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) return null;
  if (!/:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}
