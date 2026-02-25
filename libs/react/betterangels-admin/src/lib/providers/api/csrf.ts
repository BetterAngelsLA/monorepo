import { CSRF_COOKIE_NAME } from './constants';

const getTokenFromWeb = (): string | null =>
  document.cookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`))?.[1] ?? null;

export const getCSRFToken = async (
  apiUrl: string,
  csrfUrl: string
): Promise<string | null> => {
  const readToken = async () => getTokenFromWeb();

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
