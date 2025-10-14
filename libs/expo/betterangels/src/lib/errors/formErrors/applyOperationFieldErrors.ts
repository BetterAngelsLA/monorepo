import { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { OperationMessage } from '../../apollo';
import { TFieldError } from './types';

export function applyOperationFieldErrors<T extends FieldValues>(
  errors: TFieldError[] | OperationMessage[],
  setError: UseFormSetError<T>
) {
  errors.forEach(({ field, message }) => {
    if (!field) {
      return;
    }

    setError(field as Path<T>, { type: 'manual', message });
  });
}
