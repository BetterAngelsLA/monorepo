import {
  POSTHOG_PROXY_HOST,
  POSTHOG_UI_HOST,
  ShelterSearchEvent,
  decodeShelterHandoff,
  isPrivateRoutePath,
  redactPrivateRouteProperties,
  type ShelterHandoff,
} from '@monorepo/shared/shelter-handoff';
import type { PostHogConfig } from 'posthog-js';

/**
 * Paths that belong to a signed-in surface.
 *
 * The site serves the staff operator app under `/operator` (see `App.tsx`),
 * and the site's New Relic privacy rules redact those URLs. Kept local rather
 * than imported so this module — loaded before React mounts — does not pull the
 * shelter UI barrel in behind it.
 */
const PRIVATE_PATH_PREFIXES = ['/operator'];

/** Anything that must vanish from a recording entirely, on either surface. */
const BLOCK_SELECTOR = '.ph-no-capture';

/** Opt a node into the recording on the operator surface: `data-record="true"`. */
const SAFE_ATTRIBUTE = 'record';

/** Whether an element was explicitly marked safe to record. */
function isMarkedSafe(element?: HTMLElement): boolean {
  return element?.dataset?.[SAFE_ATTRIBUTE] === 'true';
}

/**
 * Masks text and input values unless the element opted in.
 *
 * Whitespace is left alone so the recording keeps its layout rather than
 * turning every newline into asterisks.
 */
function maskUnlessMarked(text: string, element?: HTMLElement): string {
  if (isMarkedSafe(element) || text.trim().length === 0) {
    return text;
  }

  return '*'.repeat(text.length);
}

/**
 * Replay settings for the two surfaces that share this origin.
 *
 * The public site is anonymous and its page content is what the funnel is
 * about, so only inputs and explicitly blocked elements are hidden.
 *
 * The operator app is a staff surface, so it inverts the default: every text
 * node and input value is masked unless it carries `data-record="true"`. A
 * field or component added later is redacted until someone decides otherwise,
 * which is the property that matters — the alternative, blocking known-bad
 * elements, leaks the first time someone forgets one.
 */
/**
 * The public surface.
 *
 * `maskAllInputs` covers the address a visitor types into the location search —
 * the one piece of personal data this site receives — and is pinned despite
 * being the default. The autocomplete renders that address as text rather than
 * in an input, so it carries `ph-no-capture` instead. The map is a canvas and
 * records blank either way, so blocking it would only put a grey rectangle over
 * the page's main content.
 */
const PUBLIC_RECORDING = {
  maskAllInputs: true,
  blockSelector: BLOCK_SELECTOR,
} as const;

const OPERATOR_RECORDING = {
  maskAllInputs: true,
  maskTextSelector: '*',
  maskTextFn: maskUnlessMarked,
  maskInputFn: maskUnlessMarked,
  blockSelector: BLOCK_SELECTOR,
} as const;

/**
 * PostHog for the public shelter site.
 *
 * The site is anonymous, so a visit joins an outreach-app session only when the
 * app hands one over in the URL fragment. This is the receiving half of that
 * contract; the parameter names, decoder and funnel event names come from
 * `@monorepo/shared/shelter-handoff`.
 */

/** Drops the fragment before anything captures a URL, so the handoff id never
 * reaches `$current_url` or a `Referer`. */
function stripHandoffFromUrl(): void {
  const { pathname, search } = window.location;

  window.history.replaceState(null, '', `${pathname}${search}`);
}

export function initAnalytics(): void {
  const handoff = decodeShelterHandoff(window.location.hash);
  const isHandoff = Boolean(handoff.distinctId || handoff.sessionId);

  // Before the key check: the fragment is an identifier in the address bar
  // whether or not this build can send events, so it always comes out.
  if (isHandoff) {
    stripHandoffFromUrl();
  }

  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;

  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.warn(
        '[analytics] VITE_POSTHOG_API_KEY is not set; analytics is disabled.',
      );
    }

    return;
  }

  /**
   * Loaded on demand to keep posthog-js off the main thread of a map-heavy page;
   * `$pageview` therefore lands a moment after load.
   *
   * For e2e: posthog-js silently drops traffic whose user agent,
   * `userAgentData.brands` or `navigator.webdriver` looks automated, so a
   * Playwright run needs `opt_out_useragent_filter: true`.
   */
  void import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(apiKey, buildInitConfig({ handoff }));

      posthog.register({ app: 'shelter-web' });

      posthog.capture(ShelterSearchEvent.Landed, {
        handoff: Boolean(handoff.sessionId),
        handoff_person: Boolean(handoff.distinctId),
        handoff_matched: handoffJoined(handoff, posthog.get_session_id?.()),
        entry_path: window.location.pathname,
      });
    })
    .catch(() => {
      // Analytics must never break the page it is measuring.
    });
}

/**
 * Whether this build should accept traffic from an automated browser.
 *
 * posthog-js drops events whose user agent, `userAgentData.brands` or
 * `navigator.webdriver` looks automated. Two builds are expected to be driven
 * by one: a dev server, and a preview. Every preview is built with
 * `VITE_POSTHOG_E2E` — both the branch preview the pull-request workflow
 * deploys and the public one `default.yml` deploys, since they share the
 * `preview` configuration. Production keeps the filter: it is the only build
 * with real traffic to protect.
 */
export function allowsAutomatedTraffic({
  isDev,
  e2eFlag,
}: {
  isDev: boolean;
  e2eFlag: string | undefined;
}): boolean {
  return isDev || e2eFlag === 'true';
}

/**
 * Whether the handed-over session was actually adopted.
 *
 * posthog-js validates a bootstrapped session id (a UUIDv7 no older than 24
 * hours) and silently starts a fresh session when it rejects one. So "an id
 * arrived" and "the receiver took it" are different facts, and only both
 * together mean the app visit and this one are the same session.
 */
export function handoffJoined(
  handoff: ShelterHandoff,
  acceptedSessionId: string | undefined,
): boolean {
  return Boolean(handoff.sessionId && acceptedSessionId === handoff.sessionId);
}

/** Options for `posthog.init`, factored out so the privacy decisions below can
 * be asserted in a test. */
export function buildInitConfig({
  handoff,
  pathname = window.location.pathname,
}: {
  handoff: ShelterHandoff;
  /** The page the recorder starts on; the two surfaces mask differently. */
  pathname?: string;
}): Partial<PostHogConfig> {
  const isOperator = isPrivateRoutePath(pathname, PRIVATE_PATH_PREFIXES);

  return {
    api_host: POSTHOG_PROXY_HOST,
    ui_host: POSTHOG_UI_HOST,
    // Pin the config-era rather than inheriting whatever the SDK does by
    // default, so a dependency bump cannot change capture behaviour silently.
    defaults: '2026-08-30',
    /**
     * Replay here is DOM-based (rrweb), so masking is per element rather than
     * per pixel. Which defaults apply depends on the surface the recorder
     * started on — see `OPERATOR_RECORDING` / `PUBLIC_RECORDING`.
     *
     * Only production is served from the root, so the operator check is
     * base-path aware; without that, every preview would fall back to the
     * public defaults on a staff page.
     */
    session_recording: isOperator ? OPERATOR_RECORDING : PUBLIC_RECORDING,
    /**
     * Autocapture ships the clicked element's text as `$el_text`, where replay
     * masking has no reach. The operator surface turns it off rather than keep a
     * second allowlist for event properties; the public surface keeps it.
     */
    ...(isOperator ? { autocapture: false } : {}),
    /**
     * Page views are deliberately left at the SDK default (`history_change`):
     * this is a public site and its routes are what the funnel is about. But
     * `$current_url`/`$pathname` ride on every capture, and the staff operator
     * app shares the origin, so those paths are dropped here.
     *
     * `before_send`, not `sanitize_properties`: the latter is deprecated in the
     * pinned SDK, and `before_send` runs once every property is computed.
     */
    before_send: (event) => {
      // A throw here makes posthog-js drop the event silently, so an event
      // without properties is returned untouched rather than looked into.
      if (!event?.properties) {
        return event;
      }

      return {
        ...event,
        properties: redactPrivateRouteProperties(
          event.properties,
          PRIVATE_PATH_PREFIXES,
        ),
      };
    },
    ...(allowsAutomatedTraffic({
      isDev: import.meta.env.DEV,
      e2eFlag: import.meta.env.VITE_POSTHOG_E2E,
    })
      ? { opt_out_useragent_filter: true }
      : {}),
    // Continue the app's session when it handed one over. `sessionID` is only
    // meaningful alongside `distinctID`.
    ...(handoff.distinctId
      ? {
          bootstrap: {
            distinctID: handoff.distinctId,
            sessionID: handoff.sessionId,
            // The app only hands over an id after `identify(user.id)`, so this
            // is a known person; without it the visit lands as anonymous and
            // never attaches to that profile.
            isIdentifiedID: true,
          },
        }
      : {}),
  };
}
