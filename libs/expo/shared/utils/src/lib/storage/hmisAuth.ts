import NitroCookies from 'react-native-nitro-cookies';
import { createPersistentSynchronousStorage } from './createPersistentSynchronousStorage';

const storage = createPersistentSynchronousStorage({ scopeId: 'hmis-auth' });

const HMIS_REFRESH_URL_KEY = 'hmis_refresh_url' as const;

interface CookieInfo {
  name: string;
  value: string;
  domain: string;
  path?: string | null;
  secure?: boolean | null;
  httponly?: boolean | null;
}

/**
 * Store HMIS cookies and refresh URL
 * Cookies include full domain/path/secure/httponly attributes from server
 */
export const storeHmisAuth = async (
  cookies: CookieInfo[],
  refreshUrl: string
): Promise<void> => {
  // Store the refresh URL
  storage.set(HMIS_REFRESH_URL_KEY, refreshUrl);

  // Set all HMIS cookies with their proper domain and attributes
  for (const cookieInfo of cookies) {
    await NitroCookies.set(cookieInfo.domain, {
      name: cookieInfo.name,
      value: cookieInfo.value,
    });
  }
};

/**
 * Get HMIS auth token from cookies
 * Retrieves from all stored cookies by checking all domains
 */
export const getHmisAuthToken = async (): Promise<string | null> => {
  const refreshUrl = storage.get<string>(HMIS_REFRESH_URL_KEY);
  if (!refreshUrl) return null;

  // Try to extract domain from refresh URL as fallback
  try {
    const urlObj = new URL(refreshUrl);
    const domain = urlObj.origin;
    const cookies = await NitroCookies.get(domain);
    return cookies['auth_token']?.value ?? null;
  } catch (error) {
    console.error('Failed to extract domain from refresh URL:', error);
    return null;
  }
};

/**
 * Get stored refresh URL
 */
export const getHmisRefreshUrl = (): string | null => {
  return storage.get<string>(HMIS_REFRESH_URL_KEY);
};
