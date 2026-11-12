import * as WebBrowser from 'expo-web-browser';
import { openShelterSite } from './openShelterSite';

vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));

const target = 'https://shelter.example/#ba_did=distinct-1';

beforeEach(() => {
  vi.mocked(WebBrowser.openBrowserAsync).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it('hands the link to the in-app browser on native', async () => {
  await openShelterSite(target, 'ios');

  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(target);
});

it('opens a tab on web instead of the in-app browser', async () => {
  const open = vi.fn(() => ({ opener: {} as unknown }));
  vi.stubGlobal('window', { open });

  await openShelterSite(target, 'web');

  expect(open).toHaveBeenCalledWith(target, '_blank');
  // A native-only module would open nothing here.
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
});

it('reports a popup the browser refused', async () => {
  // What every popup blocker and ad blocker returns.
  vi.stubGlobal('window', { open: () => null });

  await expect(openShelterSite(target, 'web')).rejects.toThrow(
    'SHELTER_POPUP_BLOCKED',
  );
});

it('drops the handle the new tab would hold back', async () => {
  const opened: { opener: unknown } = { opener: {} };
  vi.stubGlobal('window', { open: () => opened });

  await openShelterSite(target, 'web');

  expect(opened.opener).toBeNull();
});
