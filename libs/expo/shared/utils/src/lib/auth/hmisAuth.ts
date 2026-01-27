import { jwtDecode } from 'jwt-decode';
import {
  getHmisApiUrl,
  getHmisAuthToken,
  storeHmisApiUrl,
  storeHmisAuthToken,
} from './authStorage';

export { storeHmisAuthToken, getHmisAuthToken, storeHmisApiUrl, getHmisApiUrl };

export const isHmisTokenExpired = async (): Promise<boolean> => {
  const token = await getHmisAuthToken();
  if (!token) {
    return true;
  }

  try {
    const payload = jwtDecode<{ exp?: number }>(token);
    if (!payload.exp) {
      return true;
    }
    return payload.exp < Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
};
