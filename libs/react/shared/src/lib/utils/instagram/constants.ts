/** Instagram handles: letters, numbers, periods and underscores (max 30). */
export const INSTAGRAM_HANDLE_REGEX = /^[A-Za-z0-9._]{1,30}$/;

/** Hosts that point at Instagram (legacy `instagr.am` short domain included). */
export const INSTAGRAM_HOST_REGEX =
  /^(?:www\.)?(?:instagram\.com|instagr\.am)$/i;

export const INSTAGRAM_BASE_URL = 'https://instagram.com';
