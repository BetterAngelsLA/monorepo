/**
 * The client's own configuration.
 *
 * The replay masks asserted below are the only thing keeping client data out of
 * a screenshot recording, and dropping one breaks no other test. Same reasoning
 * as `apps/betterangels/src/monitoring/privacy.node-test.ts` for New Relic.
 */
const posthog = vi.hoisted(() => {
  const calls: Array<{ apiKey: string; options: Record<string, unknown> }> = [];

  class PostHogMock {
    static calls = calls;

    capture = vi.fn();
    register = vi.fn();
    flush = vi.fn(() => Promise.resolve());
    getDistinctId = () => 'distinct-1';
    getSessionId = () => '018f4c0e-0000-7000-8000-000000000000';

    constructor(apiKey: string, options: Record<string, unknown>) {
      calls.push({ apiKey, options });
    }
  }

  return { PostHogMock };
});

vi.mock('posthog-react-native', () => ({ default: posthog.PostHogMock }));

async function importClient() {
  vi.resetModules();

  return import('./client');
}

beforeEach(() => {
  posthog.PostHogMock.calls.length = 0;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

it('records screenshots only with every masking control on', async () => {
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_API_KEY', 'phc_test');

  const { getAnalyticsClient } = await importClient();
  expect(getAnalyticsClient()).not.toBeNull();

  const [{ options }] = posthog.PostHogMock.calls;
  const replay = options['sessionReplayConfig'] as Record<string, unknown>;

  expect(options['enableSessionReplay']).toBe(true);
  expect(replay['maskAllTextInputs']).toBe(true);
  expect(replay['maskAllImages']).toBe(true);
  // iOS system pickers: photo library, contacts.
  expect(replay['maskAllSandboxedViews']).toBe(true);
  // Console output and request paths both carry client data.
  expect(replay['captureLog']).toBe(false);
  expect(replay['captureNetworkTelemetry']).toBe(false);
});

it('does not fall back to file persistence', async () => {
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_API_KEY', 'phc_test');

  const { getAnalyticsClient } = await importClient();
  getAnalyticsClient();

  const [{ options }] = posthog.PostHogMock.calls;
  // expo-file-system has no web build; the SDK must use the injected storage.
  expect(options['customStorage']).toBeDefined();
});

it('tags every event with the deployment it came from', async () => {
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_API_KEY', 'phc_test');
  vi.stubEnv('EXPO_PUBLIC_APP_ENV', 'production');

  const { getAnalyticsClient } = await importClient();
  const client = getAnalyticsClient();

  expect(client?.register).toHaveBeenCalledWith(
    expect.objectContaining({ environment: 'production', platform: 'ios' }),
  );
});

it('is inert without a project key, and stays inert across calls', async () => {
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_API_KEY', '');

  const { getAnalyticsClient } = await importClient();

  expect(getAnalyticsClient()).toBeNull();
  expect(getAnalyticsClient()).toBeNull();
  expect(posthog.PostHogMock.calls).toHaveLength(0);
});

it('constructs one client no matter how many call sites ask for it', async () => {
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_API_KEY', 'phc_test');

  const { getAnalyticsClient, resetAnalyticsClient } = await importClient();
  const first = getAnalyticsClient();
  const second = getAnalyticsClient();

  expect(first).toBe(second);
  expect(posthog.PostHogMock.calls).toHaveLength(1);

  // The test seam resets the singleton so another case can assert fresh config.
  resetAnalyticsClient();
  expect(getAnalyticsClient()).not.toBe(first);
  expect(posthog.PostHogMock.calls).toHaveLength(2);
});

// The test engine runs as native, which is the case that must stay direct.
it('sends natively straight to PostHog, not through the web proxy', async () => {
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_API_KEY', 'phc_test');

  const { getAnalyticsClient } = await importClient();
  getAnalyticsClient();

  const [{ options }] = posthog.PostHogMock.calls;
  expect(options['host']).toBeUndefined();
});
