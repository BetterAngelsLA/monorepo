import { router } from 'expo-router';
import NitroCookies from 'react-native-nitro-cookies';

type ShowSnackbarFn = (params: {
  message: string;
  type: 'error' | 'success' | 'info';
}) => void;

type SetUserFn = (user: undefined) => void;

/**
 * Clears all session data (cookies and user state).
 * Shared by both logout and session expiration flows.
 */
export async function clearSession(setUser: SetUserFn): Promise<void> {
  await NitroCookies.clearAll();
  setUser(undefined);
}

/**
 * Centralized handler for all session expiration / 401 errors.
 *
 * This is called from:
 * - Apollo GraphQL error link (unauthorized errors from Django/HMIS proxy)
 * - HMIS REST client (direct 401 responses from HMIS API)
 * - Session monitor (proactive expiration check in UserProvider)
 *
 * Clears all cookies and user state, shows toast, and redirects to auth screen.
 */
export async function handleSessionExpired(
  showSnackbar: ShowSnackbarFn,
  setUser: SetUserFn
): Promise<void> {
  await clearSession(setUser);

  showSnackbar({
    message: 'Your session has expired. Please log in again.',
    type: 'error',
  });

  // Small delay to ensure snackbar is visible before navigation
  setTimeout(() => {
    router.replace('/auth');
  }, 100);
}
