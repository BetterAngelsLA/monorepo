import { getCookie, eraseCookie } from './cookies';

/**
 * Read a CSRF cookie value with duplicate cleanup across subdomains.
 * Returns the first (deduplicated) value or ``null``.
 */
export const readCsrfToken = async (name: string): Promise<string | null> => {
  let t = getCookie(name);
  if (t.length > 1) {
    const parts = window.location.hostname.split('.');
    for (let i = 0; i < parts.length - 1 && t.length > 1; i++)
      eraseCookie(name, '.' + parts.slice(i).join('.'));
    t = getCookie(name);
  }
  return t[0] ?? null;
};

/** Fetch a fresh CSRF token from the Django admin login endpoint. */
export const refreshCsrfToken = async (path: string): Promise<void> => {
  await fetch(path, { credentials: 'include' });
};
