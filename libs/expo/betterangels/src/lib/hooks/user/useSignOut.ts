import { gql } from '@apollo/client';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { clearActiveOrgId } from '@monorepo/ba-platform';
import {
  HMIS_API_URL_STORAGE_KEY,
  HMIS_AUTH_DOMAIN_STORAGE_KEY,
} from '@monorepo/expo/shared/clients';
import CookieManager from '@preeternal/react-native-cookie-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { cancelAllUploadRunners } from '../../providers/uploadProgress/uploadRunnerRegistry';
import { useUser } from '../../providers/user/UserProvider';

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export default function useSignOut() {
  const client = useApolloClient();
  const queryClient = useQueryClient();
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
    // Clears the HMIS `auth_token` cookie along with everything else.
    await CookieManager.clearAll();
    // The HMIS session pointers live in AsyncStorage, not the cookie jar —
    // without removing them the next login could inherit a stale HMIS host
    // mapping (e.g. an old sandbox domain).
    await Promise.all([
      AsyncStorage.removeItem(HMIS_API_URL_STORAGE_KEY),
      AsyncStorage.removeItem(HMIS_AUTH_DOMAIN_STORAGE_KEY),
    ]);
    await client.clearStore();
    // Cached query data (e.g. direct-HMIS client search/detail responses)
    // would otherwise surface for the next user on this device.
    queryClient.clear();
    // The next user must not inherit this one's organization.
    clearActiveOrgId();
    setUser(undefined);
  }, [logout, setUser, client, queryClient]);

  return { signOut, loading, error };
}
