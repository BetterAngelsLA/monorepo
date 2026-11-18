import Constants from 'expo-constants';

/**
 * Where the deploy publishes the id of the build it just shipped.
 *
 * Read from the same document as the app, so it is fetched with the app's own
 * cache policy (`no-cache`, set by the deploy) rather than a CDN-cached copy.
 */
export const VERSION_MANIFEST_FILE = 'version.json';

type TVersionManifest = {
  buildId?: string;
};

/**
 * Absolute path to the manifest for a given deploy prefix.
 *
 * Split out from `getVersionManifestUrl` so the sub-path case is testable
 * without faking `expo-constants`: a deployed branch bundle lives under
 * `experiments.baseUrl` (`/branches/x`), and a root-absolute `/version.json`
 * would read *another deployment's* manifest and prompt on every load. The base
 * path is absent for a root deployment, which is the common case.
 */
export function buildVersionManifestUrl(baseUrl?: string | null): string {
  const base =
    typeof baseUrl === 'string' ? baseUrl.trim().replace(/\/+$/, '') : '';

  return `${base}/${VERSION_MANIFEST_FILE}`;
}

/** The manifest URL for the deployment this bundle was built into. */
export function getVersionManifestUrl(): string {
  return buildVersionManifestUrl(Constants.expoConfig?.experiments?.baseUrl);
}

/**
 * The build id the deployment is currently serving, or `null` when it cannot
 * be determined.
 *
 * `null` rather than throwing for every failure mode — offline, a 404 on a
 * deployment that predates the manifest, a 200 that is really the SPA fallback
 * HTML, malformed JSON — because the caller's only decision is "should I
 * interrupt the user?", and the answer to all of them is no. A background check
 * that surfaced its own errors would be worse than the staleness it fixes.
 */
export async function fetchDeployedBuildId(
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const response = await fetchImpl(getVersionManifestUrl(), {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });

    if (!response.ok) return null;

    const manifest = (await response.json()) as TVersionManifest;

    return typeof manifest?.buildId === 'string' && manifest.buildId.trim()
      ? manifest.buildId.trim()
      : null;
  } catch {
    return null;
  }
}
