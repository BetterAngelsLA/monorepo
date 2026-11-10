/**
 * PostHog's managed reverse proxy for the BetterAngels domain.
 *
 * Shared, because both browser surfaces send through it: the shelter site and
 * the outreach app's web build. A second copy of this hostname would drift, and
 * a drifted copy fails quietly — the SDK retries against a host that no longer
 * resolves.
 *
 * Native needs neither: there is no browser, no blocker and no CORS in the app
 * runtime, so `client.ts` only sets `host` on web.
 */
export const POSTHOG_PROXY_HOST = 'https://k.betterangels.la';

/** PostHog's own domain, so the toolbar and in-app links resolve. */
export const POSTHOG_UI_HOST = 'https://us.posthog.com';
