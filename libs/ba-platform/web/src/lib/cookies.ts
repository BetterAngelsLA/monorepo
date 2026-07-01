/**
 * Browser cookie helpers.
 *
 * These are low-level ``document.cookie`` operations used by the CSRF
 * token provider.  They live in ``ba-platform`` because they are only
 * consumed by ``createWebFetchClient`` — there is no general-purpose
 * cookie library here.
 */

/** Return every cookie value matching ``name`` (handles subdomain duplicates). */
export const getCookie = (name: string): string[] => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  const matches: string[] = [];

  for (let i = 0; i < ca.length; i++) {
    const c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      matches.push(c.substring(nameEQ.length, c.length));
    }
  }

  return matches;
};

/** Remove a cookie by name, optionally scoped to a specific domain. */
export const eraseCookie = (name: string, hostname?: string) => {
  if (hostname) {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${hostname}`;
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${hostname}; Secure`;
  } else {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure`;
  }
};
