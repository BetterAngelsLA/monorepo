interface CookieInfo {
  values: string[];
  hasDuplicates: boolean;
}

interface CookieOptions {
  days?: number;
  path?: string;
  secure?: boolean;
}

const DEFAULT_COOKIE_EXPIRY_DAYS = 30;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const setCookie = (
  name: string,
  value: string,
  days = DEFAULT_COOKIE_EXPIRY_DAYS,
  options: Partial<CookieOptions> = {}
) => {
  const { path = '/', secure = true } = options;

  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * ONE_DAY_MS);
    expires = '; expires=' + date.toUTCString();
  }

  const securePart = secure ? '; Secure' : '';
  document.cookie = `${name}=${
    value || ''
  }${expires}; path=${path}${securePart}`;
};

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

export const getCookieInfo = (name: string): CookieInfo => {
  const values = getCookie(name);
  return {
    values,
    hasDuplicates: values.length > 1,
  };
};

export const eraseCookie = (name: string, hostname?: string) => {
  if (hostname) {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${hostname}`;
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${hostname}; Secure`;
  } else {
    // If no hostname provided, try without domain
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure`;
  }
};
