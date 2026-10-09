import { toInstagramUrl } from './toInstagramUrl';

/**
 * True when `value` is a valid Instagram URL or handle — the accepted shapes are
 * `toInstagramUrl`'s (bare handle, `@handle`, an `instagram.com` link).
 *
 * This is the validation entry point. It exists so it's visible that
 * `toInstagramUrl` is relied on for validation, not just link building — change
 * its strictness deliberately.
 */
export function isValidInstagramUrlOrHandle(value?: string | null): boolean {
  return toInstagramUrl(value) !== null;
}
