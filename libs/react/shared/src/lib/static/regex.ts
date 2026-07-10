export const Regex = {
  nonBlank: /^\s*\S.*$/,
  date: /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}$/,
  time: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/,
  phoneNumber: /^[2-9]\d{2}[2-9]\d{6}$/,
  phoneNumberWithExtensionUS: /^[2-9]\d{2}[2-9]\d{6}(x\d+)?$/,
  /** Accepts common phone formats: digits, spaces, dashes, parens, leading +, and extensions via x/ext/extension. */
  phoneNumberLoose: /^\+?\d[\d\s\-().]*(\s*(x|ext|extension)\.?\s*\d+)?$/i,
  californiaId: /^[A-Z]\d{7}$/,
  /** Bare domain with optional path/query — no scheme. Accepts google.com, example.org/path?a=1 */
  domain: /^[\w.-]+\.[a-zA-Z]{2,63}(\/\S*)?(\?\S*)?$/i,
  /** Full URL with http/https scheme. Accepts https://google.com, http://example.org/path?a=1 */
  url: /^https?:\/\/[\w.-]+\.[a-zA-Z]{2,63}(\/\S*)?(\?\S*)?$/i,
} as const;
