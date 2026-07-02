import type { FieldError } from '@monorepo/ba-platform';
import { FieldValues, Path, UseFormSetError } from 'react-hook-form';

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
