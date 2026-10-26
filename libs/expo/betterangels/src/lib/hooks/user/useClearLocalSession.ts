import { useApolloClient } from '@apollo/client/react';
import { clearActiveOrgId } from '@monorepo/ba-platform';
import {
  HMIS_API_URL_STORAGE_KEY,
  HMIS_AUTH_DOMAIN_STORAGE_KEY,
} from '@monorepo/expo/shared/clients';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { cancelAllUploadRunners } from '../../providers/uploadProgress/uploadRunnerRegistry';
import { clearReferralExportCache } from '../../screens/Client/Referrals/shareReferralText';
import { useUser } from '../../providers/user/UserProvider';
import { clearSessionCookies } from './clearSessionCookies';

/**
 * Clears all local session state: in-flight uploads, cookies, the HMIS storage
 * pointers and cached user-scoped data.
 *
 * Single home for the teardown used after a server logout (`useSignOut`) and on
 * the `/auth` screen, which catches sessions that died without a sign-out (401
 * redirects, app restart with an expired session). Steps are isolated so a
 * failing cleanup cannot leave the user "signed in" locally.
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

    await clearSessionCookies();

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

    // Exported referral summaries are the most sensitive artifact the app
    // writes to disk, so they do not survive the session either.
    clearReferralExportCache();

    // The next user must not inherit this one's organization.
    clearActiveOrgId();
    setUser(undefined);
  }, [client, queryClient, setUser]);
}
