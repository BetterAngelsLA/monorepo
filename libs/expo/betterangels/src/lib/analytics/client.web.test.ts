import type { PostHogConfig } from 'posthog-js';

/**
 * The web client's own configuration.
 *
 * Two kinds of assertion here. The masks and the disabled capture defaults are
 * the only thing keeping client records out of a recording and out of event
 * properties; and `api_host` is the same first-party proxy the shelter site
 * uses, without which a blocker silently drops the whole app's traffic.
 */
const posthog = vi.hoisted(() => {
  const init = vi.fn();
  const register = vi.fn();

  return {
    init,
    register,
    capture: vi.fn(),
    flush: vi.fn(() => Promise.resolve()),
    identify: vi.fn(),
    reset: vi.fn(),
    get_distinct_id: vi.fn(() => 'distinct-1'),
    get_session_id: vi.fn(() => '018f4c0e-0000-7000-8000-000000000000'),
  };
});

vi.mock('posthog-js', () => ({ default: posthog }));

async function importClient() {
  vi.resetModules();

  return import('./client.web');
}

/** `posthog.init` arguments, i.e. the key and the options this build ships. */
function initCall() {
  expect(posthog.init).toHaveBeenCalledTimes(1);

  const [apiKey, options] = posthog.init.mock.calls[0] as [
    string,
    Partial<PostHogConfig>,
  ];

  return { apiKey, options };
}

beforeEach(() => {
  // The module refuses to build a client outside a browser.
  vi.stubGlobal('window', {});
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_API_KEY', 'phc_test');
  posthog.init.mockReset();
  posthog.register.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('records nothing until someone decides what to mask', async () => {
  const { getAnalyticsClient } = await importClient();
  getAnalyticsClient();

  const { options } = initCall();

  // This build renders client names, notes and documents as DOM. Recording it
  // is a privacy decision, so a project-side toggle must not be enough.
  expect(options['disable_session_recording']).toBe(true);

  const recording = options['session_recording'] as Record<string, unknown>;
  expect(recording['maskAllInputs']).toBe(true);
  // Every text node: client names and note bodies are rendered as text.
  expect(recording['maskTextSelector']).toBe('*');
  expect(recording['blockSelector']).toBe('.ph-no-capture');
});

it('does not capture page URLs or clicks on its own', async () => {
  const { getAnalyticsClient } = await importClient();
  getAnalyticsClient();

  const { options } = initCall();

  // A client profile carries the client id in its path, and autocapture would
  // also send the text of whatever was clicked.
  expect(options['capture_pageview']).toBe(false);
  expect(options['capture_pageleave']).toBe(false);
  expect(options['autocapture']).toBe(false);
});

it('sends through the first-party proxy so blockers do not match the domain', async () => {
  const { getAnalyticsClient } = await importClient();
  getAnalyticsClient();

  const { apiKey, options } = initCall();

  expect(apiKey).toBe('phc_test');
  expect(options['api_host']).toBe('https://k.betterangels.la');
  expect(options['ui_host']).toBe('https://us.posthog.com');
  // Pinned so a dependency bump cannot change capture behaviour silently.
  expect(options['defaults']).toBe('2026-08-30');
});

it('keeps its identity in storage, not in a cookie', async () => {
  const { getAnalyticsClient } = await importClient();
  getAnalyticsClient();

  const { options } = initCall();
  expect(options['persistence']).toBe('localStorage');
});

it('tags every event with the deployment it came from', async () => {
  vi.stubEnv('EXPO_PUBLIC_APP_ENV', 'staging');

  const { getAnalyticsClient } = await importClient();
  getAnalyticsClient();

  // `platform` is whatever the engine running this file reports, so only the
  // deployment is pinned here.
  expect(posthog.register).toHaveBeenCalledWith(
    expect.objectContaining({ environment: 'staging' }),
  );
});

it('puts the common properties back after a reset', async () => {
  const { getAnalyticsClient } = await importClient();
  const client = getAnalyticsClient();

  // `reset()` clears registered properties; a sign-out must not cost every
  // later event its `environment`.
  posthog.register.mockClear();
  client?.reset();

  expect(posthog.reset).toHaveBeenCalled();
  expect(posthog.register).toHaveBeenCalledWith(
    expect.objectContaining({ environment: expect.anything() }),
  );
});

it('is inert without a project key, and stays inert across calls', async () => {
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_API_KEY', '');

  const { getAnalyticsClient } = await importClient();

  expect(getAnalyticsClient()).toBeNull();
  expect(getAnalyticsClient()).toBeNull();
  expect(posthog.init).not.toHaveBeenCalled();
});

it('is inert in a render with no browser', async () => {
  // `unstubAllGlobals` would restore the test engine's own `window`; the point
  // here is a module evaluated where `window` does not exist.
  vi.stubGlobal('window', undefined);

  const { getAnalyticsClient } = await importClient();

  expect(getAnalyticsClient()).toBeNull();
  expect(posthog.init).not.toHaveBeenCalled();
});

it('constructs one client no matter how many call sites ask for it', async () => {
  const { getAnalyticsClient, resetAnalyticsClient } = await importClient();
  const first = getAnalyticsClient();
  const second = getAnalyticsClient();

  expect(first).toBe(second);
  expect(posthog.init).toHaveBeenCalledTimes(1);

  resetAnalyticsClient();
  expect(getAnalyticsClient()).not.toBe(first);
  expect(posthog.init).toHaveBeenCalledTimes(2);
});

it('exposes the identity the handoff needs, whatever the SDK calls it', async () => {
  const { getAnalyticsClient } = await importClient();

  // `posthog-js` names these `get_distinct_id`/`get_session_id`; the handoff
  // reads the camelCase pair every platform provides.
  expect(getAnalyticsClient()?.getDistinctId()).toBe('distinct-1');
  expect(getAnalyticsClient()?.getSessionId()).toBe(
    '018f4c0e-0000-7000-8000-000000000000',
  );
});
