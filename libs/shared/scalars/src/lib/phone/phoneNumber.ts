import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { PhoneNumberString } from '../branded';

/**
 * The API serializes phone numbers as national digits with an optional
 * `x`-delimited extension — `"2135551234"`, `"2135551234x22"`. The country code
 * is stripped server-side, so parsing assumes US.
 */
const DEFAULT_REGION = 'US';

/** Suppresses the ` ext. NN` that `format` appends to the national form. */
const omitExtension = (formattedNumber: string) => formattedNumber;

export type PhoneNumberParts = {
  /**
   * Display form of the number alone, without the extension — for callers that
   * render the extension in its own element.
   */
  formatted: string;
  /** Extension digits, when the value carried one. */
  extension?: string;
  /** `formatted` and the extension as one string, for callers that render one. */
  display: string;
  /**
   * The number part of a `tel:` URI — digits, with `,<extension>` appended so
   * the dialer pauses before sending it. `''` when there is nothing to dial.
   *
   * Not `getURI()`, which emits the RFC 3966 `;ext=` form: iOS documents `tel:`
   * support for digits, `+`, `*`, `#`, `,` and `;` and does not parse `ext=`,
   * and Android's dialer honours the pause characters rather than RFC
   * parameters.
   */
  dial: string;
};

/**
 * Split a phone scalar into the pieces a UI needs. Parsing, extension handling
 * and national formatting all come from libphonenumber-js — it reads
 * `"2135551234x22"` natively.
 *
 * There is no validity gate. `format` degrades to the bare digits for a number
 * the metadata will not vouch for, and plenty of real values are in that
 * bucket: a seven-digit local number and an unallocated area code are both
 * `isPossible() === false` yet both have to display and dial. Only input the
 * parser rejects outright is handed back untouched, so it displays rather than
 * vanishing.
 */
export function toPhoneParts(
  value: PhoneNumberString | null | undefined,
): PhoneNumberParts {
  const trimmed = value?.trim();

  if (!trimmed) {
    return { formatted: '', display: '', dial: '' };
  }

  const parsed = parsePhoneNumberFromString(trimmed, DEFAULT_REGION);

  if (!parsed) {
    return { formatted: trimmed, display: trimmed, dial: '' };
  }

  const { nationalNumber, ext } = parsed;
  const formatted = parsed.format('NATIONAL', {
    formatExtension: omitExtension,
  });

  return {
    formatted,
    extension: ext,
    display: ext ? `${formatted} ext. ${ext}` : formatted,
    dial: ext ? `${nationalNumber},${ext}` : nationalNumber,
  };
}
