const DEFAULT_COOKIE_EXPIRY_DAYS = 30;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const setCookie = (
  name: string,
  value: string,
  days = DEFAULT_COOKIE_EXPIRY_DAYS
) => {
  let expires = '';

  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * ONE_DAY_MS);
    expires = '; expires=' + date.toUTCString();
  }

  document.cookie = name + '=' + (value || '') + expires + '; path=/';
};

export const getCookie = (name: string) => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];

    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length);
    }

    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }

  return null;
};

export const eraseCookie = (name: string) => {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};
