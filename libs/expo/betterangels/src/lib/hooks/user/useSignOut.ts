import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { endReferralDraftSession } from '../../draft/referralDraftStorage';
import useClearLocalSession from './useClearLocalSession';

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export default function useSignOut() {
  const clearLocalSession = useClearLocalSession();
  const [logout, { loading, error }] = useMutation(LOGOUT_MUTATION);

  const signOut = useCallback(async () => {
    // Wipe the unowned legacy draft and revoke loaded scoped draft callbacks
    // before any await can reject. Scoped disk records remain account-isolated
    // and can be explicitly removed in the profile's retention controls.
    endReferralDraftSession();

    try {
      await logout();
    } catch (err) {
      console.error(err);
    }

    // Local teardown is shared with the /auth screen — see
    // `useClearLocalSession`.
    await clearLocalSession();
  }, [logout, clearLocalSession]);

  return { signOut, loading, error };
}
