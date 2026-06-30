/**
 * Browser cookie utilities.
 *
 * Uses ``document.cookie`` — only import from ``@monorepo/shared/web``.
 */

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

export const eraseCookie = (name: string, hostname?: string) => {
  if (hostname) {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${hostname}`;
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${hostname}; Secure`;
  } else {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure`;
  }
};
