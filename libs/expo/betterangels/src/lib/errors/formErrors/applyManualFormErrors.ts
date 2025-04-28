import { parseValidationErrors } from './parseValidationErrors';
import { TFormValidationError } from './types';

export function applyManualFormErrors<T>(
  errors: TFormValidationError[],
  setError: (name: keyof T, error: { type: string; message: string }) => void
) {
  const formErrors = parseValidationErrors(errors);

  Object.entries(formErrors).forEach(([key, message]) => {
    setError(key as keyof T, { type: 'manual', message });
  });
}
