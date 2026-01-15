import NitroCookies from 'react-native-nitro-cookies';
import { createPersistentSynchronousStorage } from './createPersistentSynchronousStorage';

const storage = createPersistentSynchronousStorage({ scopeId: 'hmis-auth' });

const HMIS_DOMAIN_KEY = 'hmis_domain' as const;
const HMIS_REFRESH_URL_KEY = 'hmis_refresh_url' as const;

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch (error) {
    console.error('Failed to extract domain from URL:', url, error);
    throw error;
  }
}

/**
 * Store HMIS cookies and refresh URL
 * Extracts HMIS domain from refresh URL and stores cookies with proper domain
 */
export const storeHmisAuth = async (
  cookies: Record<string, string>,
  refreshUrl: string
): Promise<void> => {
  // Extract and store HMIS domain from refresh URL
  const hmisDomain = extractDomain(refreshUrl);
  storage.set(HMIS_DOMAIN_KEY, hmisDomain);
  storage.set(HMIS_REFRESH_URL_KEY, refreshUrl);

  // Set all HMIS cookies with the proper HMIS domain
  for (const [name, value] of Object.entries(cookies)) {
    await NitroCookies.set(hmisDomain, {
      name,
      value,
    });
  }
};

/**
 * Get stored HMIS domain
 */
export const getHmisDomain = (): string | null => {
  return storage.get<string>(HMIS_DOMAIN_KEY);
};

/**
 * Get HMIS auth token from cookies
 */
export const getHmisAuthToken = async (): Promise<string | null> => {
  const hmisDomain = getHmisDomain();
  if (!hmisDomain) return null;

  const cookies = await NitroCookies.get(hmisDomain);
  return cookies['auth_token']?.value ?? null;
};

/**
 * Get stored refresh URL
 */
export const getHmisRefreshUrl = (): string | null => {
  return storage.get<string>(HMIS_REFRESH_URL_KEY);
};

/**
 * Get all HMIS cookies
 */
export const getAllHmisCookies = async (): Promise<Record<string, string>> => {
  const hmisDomain = getHmisDomain();
  if (!hmisDomain) return {};

  const cookies = await NitroCookies.get(hmisDomain);
  return Object.fromEntries(
    Object.entries(cookies).map(([name, cookie]) => [name, cookie.value])
  );
};

/**
 * Clear HMIS auth
 */
export const clearHmisAuth = async (): Promise<void> => {
  const hmisDomain = getHmisDomain();
  if (hmisDomain) {
    // Clear specific HMIS cookies
    const cookies = await NitroCookies.get(hmisDomain);
    for (const name of Object.keys(cookies)) {
      await NitroCookies.clearByName(hmisDomain, name);
    }
  }
  storage.remove(HMIS_DOMAIN_KEY);
  storage.remove(HMIS_REFRESH_URL_KEY);
};
