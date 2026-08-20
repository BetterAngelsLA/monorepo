import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { PhoneNumberString } from '../branded';

/**
 * The API serializes phone numbers as national digits with an optional
 * `x`-delimited extension — `"2135551234"`, `"2135551234x22"`. Since the
 * country code is already stripped server-side, parsing assumes US.
 */
const DEFAULT_REGION = 'US';
const EXTENSION_PATTERN = /^(.*?)\s*x\s*(\d+)\s*$/i;

export type ParsedPhoneNumber = {
  /** Display form of the number itself, without the extension. */
  formatted: string;
  /** Extension digits, when the value carried one. */
  extension?: string;
};

type Parsed = ParsedPhoneNumber & {
  /** Bare digits, for a `tel:` target. */
  digits: string;
};

/**
 * Formatting keys off `isPossible` rather than `isValid`: an unallocated area
 * code is still a renderable number, and refusing to format it would lose
 * ground against the hand-rolled formatter this replaces. Genuine junk comes
 * back trimmed but untouched, so it displays instead of vanishing.
 */
function parse(value: PhoneNumberString | null | undefined): Parsed | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const match = trimmed.match(EXTENSION_PATTERN);
  const core = (match ? match[1] : trimmed).trim();
  const extension = match ? match[2] : undefined;
  const parsed = parsePhoneNumberFromString(core, DEFAULT_REGION);

  return parsed?.isPossible()
    ? {
        formatted: parsed.formatNational(),
        digits: parsed.nationalNumber,
        extension,
      }
    : { formatted: core, digits: core.replace(/\D/g, ''), extension };
}

/**
 * Split a phone scalar into a display number and its extension.
 *
 * Returns a record rather than a tuple on purpose: a tuple invites callers to
 * render the whole thing where a single string belongs, which is how the raw
 * array once ended up in a text prop.
 */
export function parsePhoneNumber(
  value: PhoneNumberString | null | undefined,
): ParsedPhoneNumber {
  const parsed = parse(value);

  if (!parsed) {
    return { formatted: '' };
  }

  return { formatted: parsed.formatted, extension: parsed.extension };
}

/** Display a phone scalar as one string, extension included when present. */
export function formatPhoneNumber(
  value: PhoneNumberString | null | undefined,
): string {
  const { formatted, extension } = parsePhoneNumber(value);

  if (!formatted) {
    return '';
  }

  return extension ? `${formatted} ext. ${extension}` : formatted;
}

/**
 * Build the number part of a `tel:` URI — digits, with `,<extension>` appended
 * so the dialer pauses before sending it. Digits rather than the formatted
 * form: punctuation is tolerated by most dialers but meaningless to all of them.
 */
export function toPhoneDialString(
  value: PhoneNumberString | null | undefined,
): string {
  const parsed = parse(value);

  if (!parsed?.digits) {
    return '';
  }

  return parsed.extension
    ? `${parsed.digits},${parsed.extension}`
    : parsed.digits;
}
