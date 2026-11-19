/**
 * URL properties `posthog-js` adds to *every* capture.
 *
 * `capture_pageview: false` suppresses the `$pageview` event, not these: the SDK
 * builds them in `calculateEventProperties`, so `$current_url`, `$pathname` and
 * `$host` ride on a plain `posthog.capture()` too. The app's web build renders a
 * client profile at `/client/<id>`, which is a record id the rest of the app
 * keeps out of observability vendors — New Relic obfuscates the same route, and
 * the native client disables network telemetry for the same reason.
 *
 * Matched by suffix so the `$initial_*` and `$session_entry_*` copies go too.
 */
const URL_PROPERTY = /(?:url|pathname|host|referrer|referring_domain)$/;

/** Drops the URL-bearing properties from one event's properties. */
export function stripUrlProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  const kept: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (!URL_PROPERTY.test(key)) {
      kept[key] = value;
    }
  }

  return kept;
}

/** Properties whose value *is* a path. */
const PATH_PROPERTY = /pathname$/;

/** Properties whose value is a URL, from which the path is derived. */
const URL_VALUE_PROPERTY = /url$/;

/**
 * The path a property carries, whether it holds a path or a whole URL.
 *
 * `$pathname` is not guaranteed — a payload may carry only `$current_url` — and
 * reading its absence as "public" is how a private route ships.
 * `$referrer`/`$referring_domain` are deliberately left out: they say where the
 * visitor came from, not which route this event happened on.
 */
function pathOf(key: string, value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (PATH_PROPERTY.test(key)) return value;
  if (!URL_VALUE_PROPERTY.test(key)) return undefined;
  if (value.startsWith('/')) return value;

  try {
    return new URL(value).pathname;
  } catch {
    return undefined;
  }
}

/** Whether a path is the private prefix itself or sits underneath it. */
function isUnderPrefix(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => {
    /**
     * Not `startsWith`: only production is served from the root. Every other
     * deployment sits under the branch base path (`/branches/<branch>`), so the
     * operator route is really `/branches/<branch>/operator/…`. The prefix is
     * therefore matched at any segment boundary.
     */
    return (
      path === prefix || path.endsWith(prefix) || path.includes(`${prefix}/`)
    );
  });
}

/**
 * Drops the URL only where the path belongs to a signed-in surface.
 *
 * The shelter site is public, so its page URLs are worth keeping. It also hosts
 * the staff operator app under `/operator`, and those paths are redacted by the
 * site's own New Relic privacy rules — so they come off the event here too,
 * while the public routes keep their context.
 *
 * Every route-bearing property is checked, not just `$pathname`: the SDK's
 * set-once copies (`$session_entry_*`, `$initial_*`) survive navigation, so a
 * session that began on an operator page would otherwise keep sending that path
 * from every public page afterwards.
 */
export function redactPrivateRouteProperties(
  properties: Record<string, unknown>,
  privatePrefixes: readonly string[],
): Record<string, unknown> {
  const hasPrivateRoute = Object.entries(properties).some(([key, value]) => {
    const path = pathOf(key, value);

    return path !== undefined && isUnderPrefix(path, privatePrefixes);
  });

  return hasPrivateRoute ? stripUrlProperties(properties) : properties;
}
