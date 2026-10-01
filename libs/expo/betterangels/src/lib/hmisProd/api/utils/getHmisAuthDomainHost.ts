import { HMIS_AUTH_DOMAIN_STORAGE_KEY } from '@monorepo/expo/shared/clients';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Host the HMIS token was stored under (`hmis_auth_domain`) — included in the
 * debug payload so a token/environment mismatch (e.g. an LA token sent to the
 * sandbox host) is visible in what testers copy.
 */
export const getHmisAuthDomainHost = async (): Promise<string | null> => {
  try {
    const stored = await AsyncStorage.getItem(HMIS_AUTH_DOMAIN_STORAGE_KEY);

    return stored ? new URL(stored).host : null;
  } catch {
    return null;
  }
};
