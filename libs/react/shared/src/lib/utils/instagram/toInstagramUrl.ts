import validator from 'validator';
import {
  INSTAGRAM_BASE_URL,
  INSTAGRAM_HANDLE_REGEX,
  INSTAGRAM_HOST_REGEX,
} from './constants';

/** True when a hostname points at Instagram (legacy short domain included). */
export function isInstagramHostname(hostname: string): boolean {
  return INSTAGRAM_HOST_REGEX.test(hostname);
}

function isWebUrl(value: string): boolean {
  return validator.isURL(value, {
    protocols: ['http', 'https'],
    require_protocol: false,
    require_tld: true,
    allow_underscores: false,
  });
}

/** Matches an `http(s)://` scheme. Schemes are case-insensitive. */
const HTTP_SCHEME_REGEX = /^https?:\/\//i;

/** Prefixes `https://` unless `value` already carries an http(s) scheme. */
function withHttpScheme(value: string): string {
  return HTTP_SCHEME_REGEX.test(value) ? value : `https://${value}`;
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(withHttpScheme(value));
  } catch {
    return null;
  }
}

function toProfileUrl(handle: string): string | null {
  if (!INSTAGRAM_HANDLE_REGEX.test(handle)) {
    return null;
  }

  return `${INSTAGRAM_BASE_URL}/${handle}`;
}

/**
 * Converts an Instagram href, handle, or profile URL into a linkable URL.
 *
 * - `betterangels` / `@betterangels` → `https://instagram.com/betterangels`
 * - `instagram.com/betterangels` / `https://www.instagram.com/betterangels/` →
 *   `https://instagram.com/betterangels`
 * - Instagram deep links (posts, reels, stories, ...) are returned as an
 *   absolute URL, normalised so the scheme and host are lower-cased
 * - anything else — a non-Instagram URL, a bare domain, or an unusable value →
 *   `null`
 */
export function toInstagramUrl(hrefOrHandle?: string | null): string | null {
  const value = hrefOrHandle?.trim();

  if (!value) {
    return null;
  }

  // A leading "@" always means a handle, never a host.
  if (value.startsWith('@')) {
    return toProfileUrl(value.slice(1).trim());
  }

  const validUrl = parseUrl(value);

  if (validUrl && isInstagramHostname(validUrl.hostname)) {
    const urlSegments = validUrl.pathname.split('/').filter(Boolean);

    // A single path segment is a profile (e.g. /betterangels).
    if (urlSegments.length === 1) {
      return toProfileUrl(urlSegments[0]);
    }

    // Deep links (posts, reels, stories, ...). `url.toString()` is the
    // canonical absolute form: scheme/host lower-cased, path/query untouched.
    if (urlSegments.length > 1) {
      return validUrl.toString();
    }

    return null;
  }

  if (isWebUrl(value)) {
    // A real web URL (it has a TLD) that isn't Instagram — e.g. a pasted
    // website — is not an Instagram link. Rejecting it here also stops a bare
    // domain like `example.com` from being mistaken for a handle.
    return null;
  }

  return toProfileUrl(value);
}
