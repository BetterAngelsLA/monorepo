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

/**
 * Drops the URL only where the path belongs to a signed-in surface.
 *
 * The shelter site is public, so its page URLs are worth keeping. It also hosts
 * the staff operator app under `/operator`, and those paths are redacted by the
 * site's own New Relic privacy rules — so they come off the event here too,
 * while the public routes keep their context.
 */
export function redactPrivateRouteProperties(
  properties: Record<string, unknown>,
  privatePrefixes: readonly string[],
): Record<string, unknown> {
  const pathname = properties['$pathname'];

  if (typeof pathname !== 'string') {
    return properties;
  }

  const isPrivate = privatePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return isPrivate ? stripUrlProperties(properties) : properties;
}
