import {
  getAllHmisCookies,
  getHmisRefreshUrl,
  storeHmisAuth,
  getHmisDomain,
} from '@monorepo/expo/betterangels';

/**
 * Refresh HMIS cookies by calling HMIS refresh URL directly
 * Reads cookies and refresh URL from storage, calls HMIS, stores new cookies
 */
export async function refreshHmisToken(): Promise<boolean> {
  try {
    const [cookies, refreshUrl, hmisDomain] = await Promise.all([
      getAllHmisCookies(),
      Promise.resolve(getHmisRefreshUrl()),
      Promise.resolve(getHmisDomain()),
    ]);

    if (!refreshUrl || !cookies.auth_token) {
      console.warn('No HMIS auth data found for refresh');
      return false;
    }

    // Build cookie header from all stored cookies
    const cookieHeader = Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

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

  // Parse all cookies from Set-Cookie header(s)
  const cookies: Record<string, string> = {};
  const cookieMatches = setCookieHeaders.matchAll(/(\w+)=([^;]+)/g);

  for (const match of cookieMatches) {
    const [, name, value] = match;
    cookies[name] = value;
  }

  if (!cookies.auth_token) {
    console.error('No auth_token in refresh response cookies');
    return false;
  }

  // Store updated cookies
  await storeHmisAuth(cookies, refreshUrl);

  console.log('HMIS cookies refreshed successfully');
  return true;
}
