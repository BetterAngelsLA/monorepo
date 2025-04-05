export const FORM_ERROR_MESSAGE: Record<string, string> = {
  CA_ID_INVALID: 'California ID must be 1 letter followed by 7 numbers',
  CA_ID_IN_USE: 'California ID in use by another client',
  EMAIL_INVALID: 'Enter a valid email address',
  EMAIL_IN_USE: 'User with this Email already exists',
  HMIS_ID_IN_USE: 'HMIS ID in use by another client',
  HMIS_ID_NOT_PROVIDED: 'Enter HMIS ID or remove this entry',
  NAME_NOT_PROVIDED: 'Filling out one of the fields is required',
  PHONE_NUMBER_INVALID: 'Please enter a valid 10-digit phone number',
} as const;
