// ── Protocol-level error codes ─────────────────────────────────────────────
// Mirrors apps/betterangels-backend/common/errors.py → APIErrorCodes
export const API_ERROR_CODES = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  NOT_FOUND: 'NOT_FOUND',
} as const;

// ── Domain-level validation error messages ─────────────────────────────────
// Mirrors apps/betterangels-backend/clients/enums.py → ErrorCodeEnum
// Keys are the enum member names; values are user-facing messages shown in forms.
export const VALIDATION_ERROR_MESSAGES: Record<string, string> = {
  CA_ID_INVALID: 'California ID must be 1 letter followed by 7 numbers',
  CA_ID_IN_USE: 'California ID in use by another client',
  EMAIL_INVALID: 'Enter a valid email address',
  EMAIL_IN_USE: 'User with this Email already exists',
  HMIS_ID_IN_USE: 'HMIS ID in use by another client',
  HMIS_ID_NOT_PROVIDED: 'Enter HMIS ID or remove this entry',
  NAME_NOT_PROVIDED: 'Filling out one of the fields is required',
  PHONE_NUMBER_INVALID: 'Please enter a valid 10-digit phone number',
} as const;
