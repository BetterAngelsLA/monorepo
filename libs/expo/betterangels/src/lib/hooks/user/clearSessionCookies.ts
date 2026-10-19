import CookieManager from '@preeternal/react-native-cookie-manager';

/**
 * Clears the native cookie jar, the HMIS `auth_token` included. The platforms
 * differ only here: a browser has no JS cookie jar, so the `.web` counterpart is
 * a no-op and the rest of the teardown lives once in `useClearLocalSession`.
 *
 * Never throws: in both callers the session is already gone, so a failing native
 * cleanup must not leave the user "signed in" locally.
 */
export async function clearSessionCookies(): Promise<void> {
  try {
    await CookieManager.clearAll();
  } catch (err) {
    console.error(err);
  }
}
