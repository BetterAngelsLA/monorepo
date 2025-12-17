import { Platform } from 'react-native';
import NitroCookies from 'react-native-nitro-cookies';
import { CSRF_COOKIE_NAME } from './constants';

const getTokenFromWeb = (): string | null =>
  document.cookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`))?.[1] ?? null;

const getTokenFromNative = async (apiUrl: string): Promise<string | null> =>
  (await NitroCookies.get(apiUrl))[CSRF_COOKIE_NAME]?.value ?? null;

export const getCSRFToken = async (
  apiUrl: string,
  csrfUrl: string
): Promise<string | null> => {
  const readToken = async () =>
    Platform.OS === 'web'
      ? getTokenFromWeb()
      : await getTokenFromNative(apiUrl);

  let token = await readToken();
  if (!token) {
    await fetch(csrfUrl, {
      credentials: 'include',
      headers: { Accept: 'text/html' },
    });
    token = await readToken();
  }
  return token;
};
