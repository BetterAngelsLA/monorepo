import { isInstagramHostname, toInstagramUrl } from './toInstagramUrl';

/** Shared with form schemas so the message can't drift from the check. */
export const INSTAGRAM_INVALID_MESSAGE =
  'Enter an Instagram handle (e.g. @betterangels) or an instagram.com link.';

function isInstagramHref(href: string): boolean {
  try {
    return isInstagramHostname(new URL(href).hostname);
  } catch {
    return false;
  }
}

export type TInstagramValidation =
  | { status: 'empty' }
  | { status: 'valid'; href: string }
  | { status: 'invalid'; error: string };

/**
 * Validates an Instagram handle or profile URL by format alone — no network.
 *
 * Accepts the shapes `toInstagramUrl` resolves (bare handle, `@handle`, an
 * `instagram.com` link). Anything it cannot resolve, or that resolves to
 * another site, is reported as invalid — a pasted Facebook link or a bare
 * domain is not an Instagram handle.
 *
 * Note: this cannot tell whether the handle actually exists. Instagram has no
 * unauthenticated "does this profile exist" endpoint, returns HTTP 200 for
 * missing profiles, and rate-limits server-side lookups — so existence checks
 * could not be trusted even if we made them.
 */
export function validateInstagramUrl(
  value?: string | null,
): TInstagramValidation {
  const trimmed = value?.trim();

  if (!trimmed) {
    return { status: 'empty' };
  }

  const href = toInstagramUrl(trimmed);

  if (!href || !isInstagramHref(href)) {
    return { status: 'invalid', error: INSTAGRAM_INVALID_MESSAGE };
  }

  return { status: 'valid', href };
}
