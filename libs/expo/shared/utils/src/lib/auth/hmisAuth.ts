import { jwtDecode } from 'jwt-decode';
import { authStorage } from './authStorage';

export const isHmisTokenExpired = async (): Promise<boolean> => {
  const token = authStorage.getHmisAuthToken();
  if (!token) {
    return true;
  }

  try {
    const payload = jwtDecode<{ exp?: number }>(token);
    if (!payload.exp) {
      return true;
    }
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp < nowInSeconds;
  } catch {
    return true;
  }
};
