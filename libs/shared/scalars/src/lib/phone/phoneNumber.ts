import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { PhoneNumberString } from '../branded';

/**
 * The API serializes phone numbers as national digits with an optional
 * `x`-delimited extension — `"2135551234"`, `"2135551234x22"`. The country code
 * is stripped server-side, so parsing assumes US.
 */
const DEFAULT_REGION = 'US';

export type ParsedPhoneNumber = {
  /** Display form of the number itself, without the extension. */
  formatted: string;
  /** Extension digits, when the value carried one. */
  extension?: string;
};

/**
 * Parsing, extension handling and national formatting all come from
 * libphonenumber-js — it reads `"2135551234x22"` natively.
 *
 * Display keys off `isPossible` rather than `isValid`: an unallocated area code
 * is still a renderable number, and refusing to format it would lose ground
 * against the hand-rolled formatter this replaces. Genuine junk is returned
 * trimmed but untouched, so it displays instead of vanishing.
 */
export function parsePhoneNumber(
  value: PhoneNumberString | null | undefined,
): ParsedPhoneNumber {
  const trimmed = value?.trim();

  if (!trimmed) {
    return { formatted: '' };
  }

  const parsed = parsePhoneNumberFromString(trimmed, DEFAULT_REGION);

  if (!parsed?.isPossible()) {
    // Unrecognised input is handed back as given rather than split apart, so a
    // number the metadata does not know still displays.
    return { formatted: trimmed };
  }

  // `formatNational()` appends " ext. NN", but some callers render the extension
  // in its own element — so format the bare national number.
  const withoutExtension = parsePhoneNumberFromString(
    parsed.nationalNumber,
    DEFAULT_REGION,
  );

  return {
    formatted: withoutExtension?.formatNational() ?? parsed.nationalNumber,
    extension: parsed.ext,
  };
}

/**
 * Display a phone scalar as one string, extension included when present.
 *
 * Built on `parsePhoneNumber` so the two can never disagree about what counts
 * as the number and what counts as the extension.
 */
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
 * so the dialer pauses before sending it.
 *
 * Not `getURI()`, which emits the RFC 3966 `;ext=` form: iOS documents `tel:`
 * support for digits, `+`, `*`, `#`, `,` and `;` and does not parse `ext=`, and
 * Android's dialer honours the pause characters rather than RFC parameters.
 */
export function toPhoneDialString(
  value: PhoneNumberString | null | undefined,
): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    return '';
  }

  const parsed = parsePhoneNumberFromString(trimmed, DEFAULT_REGION);
  const digits = parsed?.nationalNumber;

  if (!digits) {
    return '';
  }

  return parsed.ext ? `${digits},${parsed.ext}` : digits;
}
