export type TValidationError = {
  field: string;
  location: string | undefined;
  errorCode: string;
};

export const ERROR_MESSAGE_MAP: Record<string, string> = {
  CA_ID_IN_USE: 'California ID must be 1 letter followed by 7 numbers',
  EMAIL_IN_USE: 'User with this Email already exists',
  HMIS_ID_IN_USE: 'HMIS ID in use by another client',
  INVALID_PHONE_NUMBER: 'Please enter a valid 10-digit phone number',
  NO_NAME_PROVIDED: 'Filling out one of the fields is required',
};

export function parseValidationErrors(
  errors: TValidationError[]
): Record<string, string> {
  const formErrors: Record<string, string> = {};
  errors.forEach((error) => {
    const message = ERROR_MESSAGE_MAP[error.errorCode];
    let fieldKey = error.field;

    if (error.location) {
      fieldKey = `${error.field}.${error.location}`;

      if (error.location.includes('__')) {
        const [index, subField] = error.location.split('__');

        fieldKey = `${error.field}[${index}].${subField}`;
      }
    }

    formErrors[fieldKey] = message;
  });
  return formErrors;
}

export function applyValidationErrors<T>(
  errors: TValidationError[],
  setError: (name: keyof T, error: { type: string; message: string }) => void
) {
  const formErrors = parseValidationErrors(errors);
  Object.entries(formErrors).forEach(([key, message]) => {
    setError(key as keyof T, { type: 'manual', message });
  });
}
