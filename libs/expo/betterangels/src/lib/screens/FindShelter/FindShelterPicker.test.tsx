/**
 * The shelter handoff from the client picker.
 *
 * Same press as the profile button, from the other entry point: the tap has to
 * open the site, record the departure with its own `source`, and carry the
 * identity that lets shelter-web record the arrival.
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { FindShelterPicker } from './FindShelterPicker';

// The component falls back to EXPO_PUBLIC_SHELTER_WEB_URL when the API origin
// is unknown. CI exports it and a dev shell may not, so pin its absence before
// the module graph loads — otherwise this file asserts differently per machine.
vi.hoisted(() => {
  delete process.env.EXPO_PUBLIC_SHELTER_WEB_URL;
});

const clients = [
  { id: 'client-1', firstName: 'Ada', lastName: 'Lovelace' },
  { id: 'client-2', firstName: 'Grace', lastName: 'Hopper' },
];

// The internal barrel pulls in every screen's native-backed dependencies (maps,
// PDF, pickers). Stub the four the picker renders.
vi.mock('../../ui-components', () => ({
  Header: ({ title }: { title: string }) => <Text>{title}</Text>,
  HorizontalContainer: ({ children }: { children: ReactNode }) => (
    <View>{children}</View>
  ),
  ClientProfileList: ({
    renderItem,
  }: {
    renderItem: (client: (typeof clients)[number]) => ReactNode;
  }) => <View>{clients.map((client) => renderItem(client))}</View>,
  ClientCard: ({ client }: { client: (typeof clients)[number] }) => (
    <Text>{`${client.firstName} ${client.lastName}`}</Text>
  ),
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  SearchBar: () => <View />,
  TextBold: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  TextRegular: ({ children }: { children: ReactNode }) => (
    <Text>{children}</Text>
  ),
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

vi.mock('../../analytics/client', () => ({
  getAnalyticsClient: () => analytics.state.client,
}));

vi.mock('../../analytics/handoffIdentity', () => ({
  getHandoffIdentity: () => ({
    distinctId: analytics.state.client?.getDistinctId() || undefined,
    sessionId: analytics.state.client?.getSessionId() || undefined,
  }),
}));

function renderPicker() {
  return render(<FindShelterPicker />);
}

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

it('lists the clients to choose from', async () => {
  await renderPicker();

  expect(screen.getByText('Ada Lovelace')).toBeOnTheScreen();
  expect(screen.getByText('Grace Hopper')).toBeOnTheScreen();
});

// Every row runs the same action, so a shared label would leave a screen-reader
// user unable to tell which client they are on.
it('names the client in each row label', async () => {
  await renderPicker();

  expect(
    screen.getByLabelText('Find shelter for Ada Lovelace'),
  ).toBeOnTheScreen();
  expect(
    screen.getByLabelText('Find shelter for Grace Hopper'),
  ).toBeOnTheScreen();
});

it('opens the shelter site with the session in the fragment', async () => {
  await renderPicker();

  await fireEvent.press(screen.getByText('Grace Hopper'));

  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
    'https://shelter.betterangels.la/#ba_did=distinct-1&ba_sid=session-1',
  );
});

it('records the tap against the picker, not the profile', async () => {
  await renderPicker();

  await fireEvent.press(screen.getByText('Ada Lovelace'));

  expect(analytics.capture).toHaveBeenCalledWith('shelter_search_opened', {
    source: 'client_picker',
    handoff: true,
  });
});

it('reports a failed open instead of leaving a start with no end', async () => {
  vi.mocked(WebBrowser.openBrowserAsync).mockRejectedValueOnce(
    new Error('no browser'),
  );

  await renderPicker();

  await fireEvent.press(screen.getByText('Ada Lovelace'));

  expect(analytics.capture).toHaveBeenCalledWith('shelter_search_failed', {
    source: 'client_picker',
  });
  expect(
    screen.getByText('Could not open the shelter search. Please try again.'),
  ).toBeOnTheScreen();
});

// Reachable by deep link even when the add-menu entry hid itself.
it('says so instead of listing clients it cannot open a site for', async () => {
  apiConfig.apiUrl = 'http://localhost:8001';

  await renderPicker();

  expect(
    screen.getByText('Shelter search is not available in this build.'),
  ).toBeOnTheScreen();
  expect(screen.queryByText('Ada Lovelace')).toBeNull();
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
});
