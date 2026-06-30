import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../../constants';
import { eraseCookie, getCookie } from './cookies';
import { createCsrfLink, type CsrfTokenProvider } from '../csrfLink';

// ---------------------------------------------------------------------------
// Web token provider (document.cookie + fetch)
// ---------------------------------------------------------------------------

const webTokenProvider: CsrfTokenProvider = {
  getToken: async (cookieName: string) => {
    let tokens = getCookie(cookieName);

    // Multi-cookie cleanup — erase duplicates across subdomains
    if (tokens.length > 1) {
      const hostParts = window.location.hostname.split('.');
      for (let i = 0; i < hostParts.length - 1 && tokens.length > 1; i++) {
        eraseCookie(cookieName, '.' + hostParts.slice(i).join('.'));
        tokens = getCookie(cookieName);
      }
    }

    if (tokens.length > 0) {
      return tokens[0];
    }

    // No token — refresh from server
    await fetch(CSRF_LOGIN_PATH, { credentials: 'include' });
    tokens = getCookie(cookieName);
    return tokens[0] ?? null;
  },
};

// ---------------------------------------------------------------------------
// Convenience instance
// ---------------------------------------------------------------------------

/** Pre-configured CSRF link for web apps (``document.cookie`` + ``fetch``). */
export const csrfLink = createCsrfLink(webTokenProvider, {
  cookieName: CSRF_COOKIE_NAME,
  headerName: CSRF_HEADER_NAME,
});

// -- Standalone token helper (outside Apollo chain) ------------------------

const readCookieValue = (name: string): string | null =>
  document.cookie.match(new RegExp(`${name}=([^;]+)`))?.[1] ?? null;

/**
 * Read the CSRF token from ``document.cookie``, refreshing from the
 * server if missing. Used by ``ApiConfigProvider`` outside the Apollo
 * link chain.
 */
export const getCsrfToken = async (
  _apiUrl: string,
  csrfUrl: string
): Promise<string | null> => {
  let token = readCookieValue(CSRF_COOKIE_NAME);
  if (!token) {
    await fetch(csrfUrl, {
      credentials: 'include',
      headers: { Accept: 'text/html' },
    });
    token = readCookieValue(CSRF_COOKIE_NAME);
  }
  return token;
};
