import NitroCookies from 'react-native-nitro-cookies';
import { createPersistentSynchronousStorage } from './createPersistentSynchronousStorage';

const storage = createPersistentSynchronousStorage({ scopeId: 'hmis-auth' });

const HMIS_REFRESH_URL_KEY = 'hmis_refresh_url' as const;

/**
 * Store HMIS refresh URL
 * Cookies are set directly via Set-Cookie headers from backend
 */
export const storeHmisAuth = async (
  refreshUrl: string
): Promise<void> => {
  // Store the refresh URL for token refresh operations
  storage.set(HMIS_REFRESH_URL_KEY, refreshUrl);
};

/**
 * Get HMIS auth token from cookies
 * Cookies are automatically managed by NitroCookies from Set-Cookie headers
 */
export const getHmisAuthToken = async (): Promise<string | null> => {
  const refreshUrl = storage.get<string>(HMIS_REFRESH_URL_KEY);
  if (!refreshUrl) return null;

  // Extract domain from refresh URL to get cookies
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
