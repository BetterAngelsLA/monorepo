import CookieManager from '@preeternal/react-native-cookie-manager';

/**
 * Clears the native cookie jar as part of session teardown.
 *
 * Split out of `useClearLocalSession` so the teardown itself lives in exactly one
 * file. The platforms differ only here (a browser has no JS cookie jar — see the
 * `.web` counterpart), and two near-identical copies of the rest of the teardown
 * would be free to drift apart.
 *
 * Never throws: in both callers the session is already gone, so a failing native
 * cleanup must not leave the user "signed in" locally.
 */
export async function clearSessionCookies(): Promise<void> {
  try {
    // Clears the HMIS `auth_token` cookie along with everything else.
    await CookieManager.clearAll();
  } catch (err) {
    console.error(err);
  }
}
