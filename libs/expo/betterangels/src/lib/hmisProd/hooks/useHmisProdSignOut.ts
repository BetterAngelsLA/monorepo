import { router } from 'expo-router';
import { useCallback } from 'react';
import useSignOut from '../../hooks/user/useSignOut';

/**
 * Force sign-out for a definitively dead HMIS session (missing token, 401,
 * 403 — see `isAuthErrorHmisProd`). Clears the session and lands on `/auth`
 * even from stack positions the guarded layouts can't reset on their own.
 *
 * Shared by `useHmisProdSessionWatch` (dead session found on foreground or
 * cold start) and by data views whose requests report a session failure, so
 * both react to the same failure the same way.
 */
export function useHmisProdSignOut(): () => Promise<void> {
  const { signOut } = useSignOut();

  return useCallback(async () => {
    await signOut();

    // The guarded layouts also redirect to /auth once the user is null;
    // route explicitly as well so the forced logout lands on the sign-in
    // screen from any stack position.
    if (router.canGoBack?.()) {
      router.dismissAll?.();
    }

    router.replace('/auth');
  }, [signOut]);
}
