import { router } from 'expo-router';

type ShowSnackbarFn = (params: {
  message: string;
  type: 'error' | 'success' | 'info';
}) => void;

/**
 * Centralized handler for all session expiration / 401 errors.
 * 
 * This is called from:
 * - Apollo GraphQL error link (unauthorized errors from Django/HMIS proxy)
 * - HMIS REST client (direct 401 responses from HMIS API)
 * - Session monitor (proactive expiration check in UserProvider)
 * 
 * Shows a toast notification and redirects to auth screen.
 */
export function handleSessionExpired(showSnackbar: ShowSnackbarFn): void {
  showSnackbar({
    message: 'Your session has expired. Please log in again.',
    type: 'error',
  });

  // Small delay to ensure snackbar is visible before navigation
  setTimeout(() => {
    router.replace('/auth');
  }, 100);
}
