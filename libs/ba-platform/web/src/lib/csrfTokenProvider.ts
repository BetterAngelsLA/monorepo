import { getCookie, eraseCookie } from './cookies';

/**
 * Read a CSRF cookie value with duplicate cleanup across subdomains.
 * Returns the first (deduplicated) value or ``null``.
 *
 * The function is ``async`` to satisfy the :type:`TokenReader` interface
 * (``@monorepo/fetch``).  The underlying ``document.cookie`` reads are
 * synchronous — the ``Promise`` wrapper exists purely for interface
 * compatibility.
 *
 * Subdomain deduplication is web-specific — React Native uses
 * ``createNativeTokenReader`` from ``@monorepo/ba-platform/expo``.
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
