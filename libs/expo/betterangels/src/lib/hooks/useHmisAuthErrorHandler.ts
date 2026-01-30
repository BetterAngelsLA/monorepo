import { HmisError } from '@monorepo/expo/shared/clients';
import { useCallback } from 'react';
import { handleSessionExpired } from '../auth';
import useSnackbar from './snackbar/useSnackbar';
import useUser from './user/useUser';

/**
 * Hook that provides a utility to handle HMIS authentication errors.
 *
 * Use in catch blocks when calling hmisClient methods:
 *
 * @example
 * ```tsx
 * const { handleHmisAuthError } = useHmisAuthErrorHandler();
 * const { getCurrentUser } = useHmisClient();
 *
 * try {
 *   const user = await getCurrentUser();
 * } catch (error) {
 *   if (handleHmisAuthError(error)) return; // Handled, redirected to auth
 *   // Handle other errors
 * }
 * ```
 */
export const useHmisAuthErrorHandler = () => {
  const { showSnackbar } = useSnackbar();
  const { setUser } = useUser();

  const handleHmisAuthError = useCallback(
    (error: unknown): boolean => {
      if (error instanceof HmisError && error.status === 401) {
        handleSessionExpired(showSnackbar, setUser);
        return true;
      }
      return false;
    },
    [showSnackbar, setUser]
  );

  return { handleHmisAuthError };
};
