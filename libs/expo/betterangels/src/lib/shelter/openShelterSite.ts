import * as WebBrowser from 'expo-web-browser';

/**
 * Opens the shelter site, and refuses to claim success when the browser did not.
 *
 * `expo-web-browser` is used for native. On web it calls `window.open` and
 * returns `opened` whether or not the browser allowed the popup — and a blocked
 * popup is the only way an open fails in a browser — so the caller could never
 * report it. Calling `window.open` directly turns that case into a rejection.
 *
 * `platform` is a parameter rather than `Platform.OS` so both branches can be
 * asserted from the engine the tests run in.
 */
export async function openShelterSite(
  target: string,
  platform: string,
): Promise<void> {
  if (platform !== 'web') {
    await WebBrowser.openBrowserAsync(target);

    return;
  }

  const opened = window.open(target, '_blank');

  if (!opened) {
    // Ad blockers and popup blockers both land here.
    throw new Error('SHELTER_POPUP_BLOCKED');
  }

  // Another origin has no business holding a handle back.
  opened.opener = null;
}
