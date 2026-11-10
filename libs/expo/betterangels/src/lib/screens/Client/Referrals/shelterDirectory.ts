// These defaults match eas.json. Shelter IDs belong to a specific backend.
const DIRECTORY_BY_API_ORIGIN: Readonly<Record<string, string>> = {
  'https://api.prod.betterangels.la': 'https://shelter.betterangels.la',
  'https://api.dev.betterangels.la': 'https://shelter.dev.betterangels.la',
};

/**
 * Resolves the directory that serves the same data as `apiUrl`.
 *
 * A directory is only ever chosen from the backend's own origin or from
 * explicit configuration, so a local development ID can never be looked up in
 * production. Query and fragment are dropped: they would otherwise be carried
 * verbatim into a link this app opens.
 */
function resolveDirectoryBase(
  apiUrl: string,
  customDirectoryUrl?: string,
): URL | null {
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
    url.search = '';
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

/** Use a directory backed by the same data, never production for a local ID. */
export function shelterDirectoryUrl(
  apiUrl: string,
  shelterId: string,
  customDirectoryUrl?: string,
): string | null {
  if (!shelterId.trim() || shelterId === '.' || shelterId === '..') return null;

  const url = resolveDirectoryBase(apiUrl, customDirectoryUrl);
  if (!url) return null;

  url.pathname = `${url.pathname.replace(/\/+$/, '')}/shelter/${encodeURIComponent(shelterId)}`;
  return url.toString();
}

/**
 * The shelter site's entry point — the map and search experience at its root.
 *
 * Not `/search`: that route is the name/location form the map opens as an
 * overlay, and both of its exits navigate back to the root. Sending someone
 * there directly drops them into a modal with no map behind it.
 *
 * Returned without a query or fragment so `withShelterHandoff` can attach the
 * PostHog identity as the only fragment.
 */
export function shelterHomeUrl(
  apiUrl: string,
  customDirectoryUrl?: string,
): string | null {
  const url = resolveDirectoryBase(apiUrl, customDirectoryUrl);
  if (!url) return null;

  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  return url.toString();
}
