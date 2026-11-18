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
 * Absolute path to the manifest, honouring a sub-path deploy.
 *
 * A deployed branch bundle lives under `experiments.baseUrl` (`/branches/x`),
 * so a root-absolute `/version.json` would look in the wrong place. The base
 * path is absent for a root deployment, which is the common case.
 */
export function getVersionManifestUrl(): string {
  const baseUrl = Constants.expoConfig?.experiments?.baseUrl;

  const base = typeof baseUrl === 'string' ? baseUrl.replace(/\/+$/, '') : '';

  return `${base}/${VERSION_MANIFEST_FILE}`;
}

/**
 * The build id the deployment is currently serving, or `null` when it cannot
 * be determined.
 *
 * `null` rather than throwing for every failure mode — offline, a 404 on a
 * deploy that predates the manifest, malformed JSON — because the caller's only
 * decision is "should I interrupt the user?", and the answer to all of them is
 * no. A background check that surfaces its own errors would be worse than the
 * staleness it is trying to fix.
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

    return manifest.buildId?.trim() || null;
  } catch {
    return null;
  }
}
