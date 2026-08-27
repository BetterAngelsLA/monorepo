import { gql } from '@apollo/client';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { clearActiveOrgId } from '@monorepo/ba-platform';
import { useCallback } from 'react';
import CookieManager from '@preeternal/react-native-cookie-manager';
import { cancelAllUploadRunners } from '../../providers/uploadProgress/uploadRunnerRegistry';
import { useUser } from '../../providers/user/UserProvider';

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export default function useSignOut() {
  const client = useApolloClient();
  const [logout, { loading, error }] = useMutation(LOGOUT_MUTATION);
  const { setUser } = useUser();

  const signOut = useCallback(async () => {
    // Uploads outlive the screens that started them, so nothing else would
    // stop them — and finishing one after sign-out would write to a client
    // record this session no longer has any business touching.
    cancelAllUploadRunners();

    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
    await CookieManager.clearAll();
    await client.clearStore();
    // The next user must not inherit this one's organization.
    clearActiveOrgId();
    setUser(undefined);
  }, [logout, setUser, client]);

  return { signOut, loading, error };
}
