import NitroCookies from 'react-native-nitro-cookies';

/**
 * Get HMIS auth token from cookies
 * Cookies are automatically managed by NitroCookies from Set-Cookie headers sent by backend
 */
export const getHmisAuthToken = async (): Promise<string | null> => {
  try {
    // HMIS cookies are set on the sandbox domain
    const domain = 'https://betterangels-sandbox.clarityhs.com';
    const cookies = await NitroCookies.get(domain);
    return cookies['auth_token']?.value ?? null;
  } catch (error) {
    console.error('Failed to get HMIS auth token from cookies:', error);
    return null;
  }
};
