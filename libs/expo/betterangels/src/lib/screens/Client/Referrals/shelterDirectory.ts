// These defaults match eas.json. Shelter IDs belong to a specific backend.
const DIRECTORY_BY_API_ORIGIN: Readonly<Record<string, string>> = {
  'https://api.prod.betterangels.la': 'https://shelter.betterangels.la',
  'https://api.dev.betterangels.la': 'https://shelter.dev.betterangels.la',
};

/** Use a directory backed by the same data, never production for a local ID. */
export function shelterDirectoryUrl(
  apiUrl: string,
  shelterId: string,
  customDirectoryUrl?: string,
): string | null {
  if (!shelterId.trim() || shelterId === '.' || shelterId === '..') return null;
  try {
    const base =
      DIRECTORY_BY_API_ORIGIN[new URL(apiUrl).origin] ?? customDirectoryUrl;
    if (!base) return null;
    const url = new URL(base);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/shelter/${encodeURIComponent(shelterId)}`;
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}
