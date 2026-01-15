import {
  getHmisAuthToken,
  getHmisRefreshUrl,
} from '@monorepo/expo/shared/utils';
import { MODERN_BROWSER_USER_AGENT } from '../../../../common';

/**
 * Refresh HMIS cookies by calling HMIS refresh URL directly
 * credentials: 'include' automatically handles Set-Cookie headers via NitroCookies
 */
export async function refreshHmisToken(): Promise<boolean> {
  try {
    const oldAuthToken = await getHmisAuthToken();
    const refreshUrl = getHmisRefreshUrl();

    if (!refreshUrl || !oldAuthToken) {
      console.warn('No HMIS auth data found for refresh');
      return false;
    }

    const headers = {
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${oldAuthToken}`,
      'User-Agent': MODERN_BROWSER_USER_AGENT,
    };

    const response = await fetch(refreshUrl, {
      method: 'GET',
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      console.error('HMIS cookie refresh failed:', response.status);
      return false;
    }

    // Verify the token actually changed
    const newAuthToken = await getHmisAuthToken();
    if (newAuthToken === oldAuthToken) {
      console.warn('HMIS token refresh did not update the token');
    }

    return true;
  } catch (error) {
    console.error('Error refreshing HMIS cookies:', error);
    return false;
  }
}
