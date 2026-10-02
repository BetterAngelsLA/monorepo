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

function parseUrl(value: string): URL | null {
  try {
    return new URL(value.startsWith('http') ? value : `https://${value}`);
  } catch {
    return null;
  }
}

function toAbsoluteWebUrl(value: string): string {
  return value.startsWith('http') ? value : `https://${value}`;
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
 * - any other URL is passed through (with an `https://` prefix when missing)
 * - empty or unusable values → `null`
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

  const url = parseUrl(value);

  if (url && isInstagramHostname(url.hostname)) {
    const segments = url.pathname.split('/').filter(Boolean);

    // A single path segment is a profile (e.g. /betterangels).
    if (segments.length === 1) {
      return toProfileUrl(segments[0]);
    }

    // Deep links (posts, reels, stories, ...) are kept as provided.
    if (segments.length > 1) {
      return toAbsoluteWebUrl(value);
    }

    return null;
  }

  if (isWebUrl(value)) {
    return toAbsoluteWebUrl(value);
  }

  return toProfileUrl(value);
}
