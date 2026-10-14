import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { clearPersistedReferralDraft } from '../../screens/Client/Referrals/referralDraftStorage';
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
    // The referral draft is a single on-device record that can hold sensitive
    // answers; it must not survive into another user's session. Clear it first,
    // before any await that can reject, so a failed cookie/store cleanup cannot
    // skip it. `clearLocalSession` does not touch this record — it clears
    // cookies, HMIS storage pointers, and cached queries.
    clearPersistedReferralDraft();

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
