import NitroCookies from 'react-native-nitro-cookies';
import { createPersistentSynchronousStorage } from '../storage/createPersistentSynchronousStorage';
import { PersistentSynchronousStorageApi } from '../storage/types';
import {
  HMIS_API_URL_COOKIE_NAME,
  HMIS_AUTH_COOKIE_NAME,
  HMIS_DOMAIN_KEY,
} from './constants';

type CookieValue = Record<string, { value: string }>;

// Dependencies that can be injected for testing
interface HmisAuthDependencies {
  storage: PersistentSynchronousStorageApi;
  getCookies: (domain: string) => Promise<CookieValue>;
}

// Default production dependencies
const defaultDependencies: HmisAuthDependencies = {
  storage: createPersistentSynchronousStorage({ scopeId: 'hmis-auth' }),
  getCookies: (domain: string) =>
    NitroCookies.get(domain) as Promise<CookieValue>,
};

// Allow dependency injection for testing
let dependencies = defaultDependencies;

/**
 * @internal - For testing only
 */
export const __setDependencies = (
  deps: Partial<HmisAuthDependencies>
): void => {
  dependencies = { ...defaultDependencies, ...deps };
};

/**
 * @internal - For testing only
 */
export const __resetDependencies = (): void => {
  dependencies = defaultDependencies;
};

/**
 * Store HMIS domain for cookie retrieval
 */
export const storeHmisDomain = (domain: string): void => {
  dependencies.storage.set(HMIS_DOMAIN_KEY, domain);
};

/**
 * Get a cookie value from HMIS domain
 */
const getHmisCookie = async (cookieName: string): Promise<string | null> => {
  try {
    const domain = dependencies.storage.get<string>(HMIS_DOMAIN_KEY);
    if (!domain) {
      return null;
    }

    const cookies = await dependencies.getCookies(domain);
    return cookies[cookieName]?.value ?? null;
  } catch (error) {
    console.warn(`Failed to get HMIS ${cookieName} from cookies:`, error);
    return null;
  }
};

/**
 * Get HMIS auth token from cookies
 */
export const getHmisAuthToken = (): Promise<string | null> => {
  return getHmisCookie(HMIS_AUTH_COOKIE_NAME);
};

/**
 * Get HMIS API URL from cookies
 */
export const getHmisApiUrl = (): Promise<string | null> => {
  return getHmisCookie(HMIS_API_URL_COOKIE_NAME).then((value) => {
    if (!value) {
      return value;
    }

    try {
      const decoded = decodeURIComponent(value);
      const trimmed = (decoded || value).trim();
      const cleaned = trimmed.replace(/\/+$/, '');

      return cleaned || null;
    } catch {
      return null;
    }
  });
};
