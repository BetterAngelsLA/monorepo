/**
 * Types for the plain-JavaScript dev proxy, so the Vitest specs under `src/` can
 * import it: TypeScript does not resolve `.js` modules without `allowJs`, and a
 * declaration keeps `dev-api-proxy.js` loadable by Node from metro.config.js
 * exactly as it is. Keep in sync with that file.
 */

/** The path the proxy mounts its targets under. The app builds URLs from it. */
export const API_PREFIX: string;

/** `name` → upstream API base URL, served under `/__api/<name>`. */
export type DevProxyTargets = Map<string, string>;

/** An `EXPO_PUBLIC_*` variable that named the proxy itself and was ignored. */
export interface DevProxyIgnored {
  variable: string;
  url: string;
  name: string;
}

/** The named targets the app's `EXPO_PUBLIC_*_API_URL` variables imply. */
export function deriveProxyTargets(
  env: Record<string, string | undefined>,
  onIgnored?: (entry: DevProxyIgnored) => void,
): DevProxyTargets;

/** The derived targets, added to or overridden by `BA_DEV_PROXY_TARGETS`. */
export function readTargets(
  env?: Record<string, string | undefined>,
  onIgnored?: (entry: DevProxyIgnored) => void,
): DevProxyTargets;

/** A configured target, or the name that was asked for and is not configured. */
export type DevProxyRoute = { name: string } | { unknown: string };

/** `null` for a request URL the proxy does not own. */
export function routeRequest(
  rawUrl: string,
  names: ReadonlySet<string>,
): DevProxyRoute | null;

/** Strip `Domain`/`Secure` and downgrade `SameSite=None`, for a localhost jar. */
export function rewriteSetCookie(cookie: string): string;

/** Rename a target's cookie to `<target>_<name>`; `csrftoken` stays readable. */
export function namespaceSetCookie(cookie: string, target: string): string;

/** This target's cookies under their real names, and no other target's at all. */
export function stripRequestCookies(
  cookieHeader: string,
  target: string,
  names: Iterable<string>,
): string;

/** Keep a redirect on the proxy origin, under the target's prefix. */
export function rewriteLocation(
  location: string,
  targetUrl: URL,
  prefix: string,
): string;

/** Metro `enhanceMiddleware` factory; inert unless `/__api` is requested. */
export function createDevApiProxy(): (
  middleware: (req: unknown, res: unknown, next: () => void) => void,
  server?: unknown,
) => (req: unknown, res: unknown, next: () => void) => void;
