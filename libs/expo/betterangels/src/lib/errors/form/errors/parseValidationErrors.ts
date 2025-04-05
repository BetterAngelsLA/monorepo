import { FORM_ERROR_MESSAGE } from './constants';
import { TFormValidationError } from './types';

export function parseValidationErrors(
  errors: TFormValidationError[]
): Record<string, string> {
  const formErrors: Record<string, string> = {};
  errors.forEach((error) => {
    const message = FORM_ERROR_MESSAGE[error.errorCode];

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
