import NitroCookies from 'react-native-nitro-cookies';
import { createPersistentSynchronousStorage } from '../storage/createPersistentSynchronousStorage';

const storage = createPersistentSynchronousStorage({ scopeId: 'hmis-auth' });

const HMIS_DOMAIN_KEY = 'hmis_domain' as const;
type CookieValue = Record<string, { value: string }>;

/**
 * Store HMIS domain for cookie retrieval
 */
export const storeHmisDomain = (domain: string): void => {
  storage.set(HMIS_DOMAIN_KEY, domain);
};

/**
 * Get a cookie value from HMIS domain
 */
const getHmisCookie = async (cookieName: string): Promise<string | null> => {
  try {
    const domain = storage.get<string>(HMIS_DOMAIN_KEY);
    if (!domain) {
      return null;
    }

    const cookies = await NitroCookies.get(domain);
    return (cookies as CookieValue)[cookieName]?.value ?? null;
  } catch (error) {
    console.error(`Failed to get HMIS ${cookieName} from cookies:`, error);
    return null;
  }
};

/**
 * Get HMIS auth token from cookies
 */
export const getHmisAuthToken = (): Promise<string | null> => {
  return getHmisCookie('auth_token');
};
