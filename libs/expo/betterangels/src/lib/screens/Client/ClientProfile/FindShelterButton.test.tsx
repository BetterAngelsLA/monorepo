/**
 * The shelter handoff from a client profile.
 *
 * The tap has to do three things in one press: open the site, record that it
 * happened, and carry the identity that lets shelter-web record the arrival.
 * A regression in any one of them is invisible in the app but breaks the
 * funnel, so all three are asserted here.
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { shouldFlushBeforeOpen } from '../../../shelter/useOpenShelterSearch';
import { FindShelterButton } from './FindShelterButton';

// The component falls back to EXPO_PUBLIC_SHELTER_WEB_URL when the API origin
// is unknown. CI exports it and a dev shell may not, so pin its absence before
// the module graph loads — otherwise this file asserts differently per machine.
vi.hoisted(() => {
  delete process.env.EXPO_PUBLIC_SHELTER_WEB_URL;
});

// The shared barrels pull in native-backed components (maps, PDF, pickers)
// whose native halves do not exist under test. Stub the two the button renders.
vi.mock('@monorepo/expo/shared/ui-components', () => ({
  Button: ({ title, onPress }: { title: string; onPress?: () => void }) => (
    <Text onPress={onPress}>{title}</Text>
  ),
  TextRegular: ({ children }: { children: ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

vi.mock('@monorepo/expo/shared/icons', () => ({
  HouseLineIcon: () => <View />,
}));

vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));

const { apiConfig } = vi.hoisted(() => ({
  apiConfig: { apiUrl: 'https://api.prod.betterangels.la' },
}));

vi.mock('@monorepo/ba-platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@monorepo/ba-platform')>()),
  useApiConfig: () => apiConfig,
}));

/**
 * The real `useAnalytics` hook runs against a fake client, so the event names,
 * the property names and the URL builder asserted below are the shipped ones —
 * only the network is stubbed.
 */
const analytics = vi.hoisted(() => {
  const capture = vi.fn();

  return {
    capture,
    state: {
      client: null as null | {
        capture: typeof capture;
        flush: () => Promise<void>;
        getDistinctId: () => string;
        getSessionId: () => string;
      },
    },
  };
});

vi.mock('../../../analytics/client', () => ({
  getAnalyticsClient: () => analytics.state.client,
  // Mirrors the shipped rule: the distinct id only travels while the client is
  // identified, the session id travels whenever there is one.
  getHandoffIdentity: () => ({
    distinctId: analytics.state.client?.getDistinctId() || undefined,
    sessionId: analytics.state.client?.getSessionId() || undefined,
  }),
}));

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(WebBrowser.openBrowserAsync).mockReset();
  analytics.capture.mockReset();
  apiConfig.apiUrl = 'https://api.prod.betterangels.la';
  analytics.state.client = {
    capture: analytics.capture,
    flush: () => Promise.resolve(),
    getDistinctId: () => 'distinct-1',
    getSessionId: () => 'session-1',
  };
});

it('opens the shelter site with the session in the fragment', async () => {
  await render(<FindShelterButton />);

  await fireEvent.press(screen.getByText('Find shelter'));

  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
    'https://shelter.betterangels.la/#ba_did=distinct-1&ba_sid=session-1',
  );
});

it('records the tap with the source and whether the session travelled', async () => {
  await render(<FindShelterButton />);

  await fireEvent.press(screen.getByText('Find shelter'));

  expect(analytics.capture).toHaveBeenCalledWith('shelter_search_opened', {
    source: 'client_profile',
    handoff: true,
    handoff_person: true,
  });
});

it('still opens the site when analytics is not configured', async () => {
  analytics.state.client = null;

  await render(<FindShelterButton />);

  await fireEvent.press(screen.getByText('Find shelter'));

  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
    'https://shelter.betterangels.la/',
  );
  expect(analytics.capture).not.toHaveBeenCalled();
});

it('renders nothing when no shelter site matches the environment', async () => {
  apiConfig.apiUrl = 'http://localhost:8001';

  await render(<FindShelterButton />);

  expect(screen.queryByText('Find shelter')).toBeNull();
});

it('reports a failed open instead of leaving a start with no end', async () => {
  vi.mocked(WebBrowser.openBrowserAsync).mockRejectedValueOnce(
    new Error('no browser'),
  );

  await render(<FindShelterButton />);

  await fireEvent.press(screen.getByText('Find shelter'));

  expect(analytics.capture).toHaveBeenCalledWith('shelter_search_failed', {
    source: 'client_profile',
  });
  expect(
    screen.getByText('Could not open the shelter search. Please try again.'),
  ).toBeOnTheScreen();
});

it('does not block the tap on a slow analytics flush', async () => {
  // The flush is bounded; a hung network must not hold the screen.
  analytics.state.client!.flush = () => new Promise<void>(() => undefined);

  await render(<FindShelterButton />);

  await fireEvent.press(screen.getByText('Find shelter'));

  expect(WebBrowser.openBrowserAsync).toHaveBeenCalled();
});

// The flag pair is derived from the client's ids, so an "always true" regression
// has to fail here rather than pass on the happy path alone.
it('reports no handoff when the client has no identity yet', async () => {
  analytics.state.client = {
    capture: analytics.capture,
    flush: () => Promise.resolve(),
    getDistinctId: () => '',
    getSessionId: () => '',
  };

  await render(<FindShelterButton />);

  await fireEvent.press(screen.getByText('Find shelter'));

  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
    'https://shelter.betterangels.la/',
  );
  expect(analytics.capture).toHaveBeenCalledWith('shelter_search_opened', {
    source: 'client_profile',
    handoff: false,
    handoff_person: false,
  });
});

it('opens once when pressed twice before the browser takes over', async () => {
  // A second tab is both a duplicate event and the popup a browser refuses.
  let release: () => void = () => undefined;

  vi.mocked(WebBrowser.openBrowserAsync).mockReturnValue(
    new Promise<void>((resolve) => {
      release = resolve;
    }) as never,
  );

  await render(<FindShelterButton />);

  // The browser stays open between the two presses, so the first press is still
  // in flight when the second arrives — that is the double tap to guard.
  const firstPress = fireEvent.press(screen.getByText('Find shelter'));
  await new Promise((resolve) => setTimeout(resolve, 0));

  await fireEvent.press(screen.getByText('Find shelter'));

  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledTimes(1);

  release();
  await firstPress;
});

// The flush buys native nothing on web and costs the user activation that
// `window.open` needs, so the two platforms must disagree here.
it('flushes before opening on native only', () => {
  expect(shouldFlushBeforeOpen('ios')).toBe(true);
  expect(shouldFlushBeforeOpen('android')).toBe(true);
  expect(shouldFlushBeforeOpen('web')).toBe(false);
});
