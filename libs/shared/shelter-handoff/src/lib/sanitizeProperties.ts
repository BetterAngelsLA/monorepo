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
 * Matched by suffix inside the SDK's `$` namespace only, so the set-once
 * (`$session_entry_*`) and initial (`$initial_*`) copies go too while a custom
 * property that happens to end in `_url` is left alone.
 */
const SDK_URL_PROPERTY = /^\$.*(?:url|pathname|host|referrer|referring_domain)$/;

/** SDK properties whose value *is* a path. */
const SDK_PATH_PROPERTY = /^\$.*pathname$/;

/** SDK properties whose value is a URL, from which the path is derived. */
const SDK_URL_VALUE_PROPERTY = /^\$.*(?:url|referrer)$/;

/** Drops the URL-bearing properties from one event's properties. */
export function stripUrlProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  const kept: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (!SDK_URL_PROPERTY.test(key)) {
      kept[key] = value;
    }
  }

  return kept;
}

/**
 * The path a property carries, whether it holds a path or a whole URL.
 *
 * `$pathname` is not guaranteed — a payload may carry only `$current_url` — and
 * reading its absence as "public" is how a private route ships.
 * `$referring_domain` is host-only, so it carries no path at all.
 */
function pathOf(key: string, value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (SDK_PATH_PROPERTY.test(key)) return value;
  if (!SDK_URL_VALUE_PROPERTY.test(key)) return undefined;
  if (value.startsWith('/')) return value;

  try {
    return new URL(value).pathname;
  } catch {
    return undefined;
  }
}

/**
 * Whether a path is a private route: the prefix itself (`/operator`), its root
 * under a deployment base path (`/branches/<branch>/operator`), or anything
 * below either (`/branches/<branch>/operator/shelter/1`).
 *
 * The prefix has to be a whole segment, so `/operators` and `/foo/myoperator`
 * do not match.
 */
function isUnderPrefix(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => {
    /**
     * Not `startsWith`: only production is served from the root. Every other
     * deployment sits under the branch base path (`/branches/<branch>`), so the
     * operator route is really `/branches/<branch>/operator/…`.
     *
     * `endsWith` is what covers the operator root at the end of a base path —
     * `/branches/<branch>/operator` with nothing after it.
     */
    return (
      path === prefix || path.endsWith(prefix) || path.includes(`${prefix}/`)
    );
  });
}

/**
 * Whether a path belongs to a signed-in surface (see `isUnderPrefix` for what
 * counts as under one).
 *
 * Exported so the recorder can be configured per surface without re-deriving
 * the base-path rules.
 */
export function isPrivateRoutePath(
  path: string,
  prefixes: readonly string[],
): boolean {
  return isUnderPrefix(path, prefixes);
}

/**
 * Drops the URL properties that point at a signed-in surface.
 *
 * The shelter site is public, so its page URLs are worth keeping. It also hosts
 * the staff operator app under `/operator`, and those paths are redacted by the
 * site's own New Relic privacy rules — so they come off the event here too,
 * while the public routes keep their context.
 *
 * Redaction is per property, not per event: every route-bearing property is
 * checked (`$session_entry_*` and `$initial_*` survive navigation, so a session
 * that began on an operator page would otherwise keep sending that path from
 * every public page), and only the properties carrying a private path are
 * dropped. Dropping the whole URL context would cost the public pages a session
 * whose first page happened to be the operator app.
 */
export function redactPrivateRouteProperties(
  properties: Record<string, unknown>,
  privatePrefixes: readonly string[],
): Record<string, unknown> {
  const kept: Record<string, unknown> = {};
  let droppedAny = false;

  for (const [key, value] of Object.entries(properties)) {
    const path = pathOf(key, value);

    if (path !== undefined && isUnderPrefix(path, privatePrefixes)) {
      droppedAny = true;

      continue;
    }

    kept[key] = value;
  }

  return droppedAny ? kept : properties;
}
