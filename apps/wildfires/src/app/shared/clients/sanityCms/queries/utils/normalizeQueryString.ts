export function normalizeQueryString(query: string): string {
  if (!query) {
    return '';
  }

  return query.replace(/\s+/g, ' ').trim();
}
