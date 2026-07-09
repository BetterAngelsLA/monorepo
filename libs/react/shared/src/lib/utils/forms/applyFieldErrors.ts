import { FieldValues, Path, UseFormSetError } from 'react-hook-form';

type FieldError = { field: string; message: string };

export function applyFieldErrors<T extends FieldValues>(
  errors: FieldError[],
  setError: UseFormSetError<T>
) {
  errors.forEach(({ field, message }) => {
    if (!field) {
      return;
    }

    setError(field as Path<T>, { type: 'manual', message });
  });
}
