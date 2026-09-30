import { useApolloClient } from '@apollo/client/react';
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

/**
 * Clears every piece of local session state: in-flight uploads, cookies (the
 * HMIS `auth_token` included), the HMIS storage pointers, and cached
 * user-scoped data.
 *
 * Single home for the teardown used in two situations:
 * - after a server logout (`useSignOut`), and
 * - on the `/auth` screen, which catches sessions that died without a
 *   sign-out (401 redirects, app restart with an expired session).
 *
 * Each step is isolated: a failing native cleanup must never leave the user
 * "signed in" locally, since in both callers the session is already gone.
 */
export default function useClearLocalSession() {
  const client = useApolloClient();
  const queryClient = useQueryClient();
  const { setUser } = useUser();

  return useCallback(async () => {
    // Uploads outlive the screens that started them, so nothing else would
    // stop them — and finishing one after the session ended would write to a
    // client record this session no longer has any business touching.
    cancelAllUploadRunners();

    try {
      // Clears the HMIS `auth_token` cookie along with everything else.
      await CookieManager.clearAll();
    } catch (err) {
      console.error(err);
    }

    // The HMIS session pointers live in AsyncStorage, not the cookie jar —
    // without removing them the next login could inherit a stale HMIS host
    // mapping (e.g. an old sandbox domain).
    try {
      await Promise.all([
        AsyncStorage.removeItem(HMIS_API_URL_STORAGE_KEY),
        AsyncStorage.removeItem(HMIS_AUTH_DOMAIN_STORAGE_KEY),
      ]);
    } catch (err) {
      console.error(err);
    }

    try {
      await client.clearStore();
    } catch (err) {
      console.error(err);
    }

    // Cached query data (e.g. direct-HMIS client search/detail responses)
    // would otherwise surface for the next user on this device.
    queryClient.clear();

    // The next user must not inherit this one's organization.
    clearActiveOrgId();
    setUser(undefined);
  }, [client, queryClient, setUser]);
}
