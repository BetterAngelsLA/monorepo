import {
  getAllHmisCookies,
  getHmisRefreshUrl,
  storeHmisAuth,
  getHmisDomain,
} from '@monorepo/expo/shared/utils';
import NitroCookies from 'react-native-nitro-cookies';

/**
 * Refresh HMIS cookies by calling HMIS refresh URL directly
 * Reads cookies and refresh URL from storage, calls HMIS, stores new cookies
 */
export async function refreshHmisToken(): Promise<boolean> {
  try {
    const cookies = await getAllHmisCookies();
    const refreshUrl = getHmisRefreshUrl();
    const hmisDomain = getHmisDomain();

    if (!refreshUrl || !cookies.auth_token) {
      console.warn('No HMIS auth data found for refresh');
      return false;
    }

    // Build cookie header from all stored cookies
    const cookieHeader = Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

    if (!cookieHeader) {
      console.warn('No cookies available for HMIS refresh');
      return false;
    }

    // Call HMIS refresh URL with all cookies
    const response = await fetch(refreshUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json, text/plain, */*',
        Authorization: `Bearer ${cookies.auth_token}`,
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      console.error('HMIS cookie refresh failed:', response.status);

      // Try POST if GET fails with 405 Method Not Allowed
      if (response.status === 405) {
        const postResponse = await fetch(refreshUrl, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json, text/plain, */*',
            Authorization: `Bearer ${cookies.auth_token}`,
            Cookie: cookieHeader,
          },
        });

        if (!postResponse.ok) {
          console.error(
            'HMIS cookie refresh failed with POST:',
            postResponse.status
          );
          return false;
        }

        return extractAndStoreNewCookies(postResponse, refreshUrl);
      }

      return false;
    }

    return extractAndStoreNewCookies(response, refreshUrl);
  } catch (error) {
    console.error('Error refreshing HMIS cookies:', error);
    return false;
  }
}

/**
 * Extract new cookies from Set-Cookie headers and store them
 * Uses NitroCookies.setFromResponse() to parse Set-Cookie headers properly
 */
async function extractAndStoreNewCookies(
  response: Response,
  refreshUrl: string
): Promise<boolean> {
  const setCookieHeaders = response.headers.get('set-cookie');
  if (!setCookieHeaders) {
    console.error('No Set-Cookie header in HMIS refresh response');
    return false;
  }

  try {
    // Use NitroCookies to parse and store Set-Cookie header(s)
    const hmisDomain = getHmisDomain();
    if (!hmisDomain) {
      console.error('No HMIS domain found in storage');
      return false;
    }

    // Parse Set-Cookie header(s) - may be multiple cookies separated by commas
    const cookieStrings = setCookieHeaders.split(',').map((s) => s.trim());

    for (const cookieStr of cookieStrings) {
      // Use NitroCookies built-in parser for Set-Cookie headers
      await NitroCookies.setFromResponse(hmisDomain, cookieStr);
    }

    // Verify auth_token was refreshed
    const updatedCookies = await NitroCookies.get(hmisDomain);
    if (!updatedCookies.auth_token) {
      console.error('No auth_token in refreshed cookies');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error parsing Set-Cookie headers:', error);
    return false;
  }
}
