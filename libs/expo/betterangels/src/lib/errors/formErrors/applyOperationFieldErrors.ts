import { OperationMessage } from '../../apollo';
import { TFieldError } from './types';

export function applyOperationFieldErrors<T>(
  errors: TFieldError[] | OperationMessage[],
  setError: (name: keyof T, error: { type: string; message: string }) => void
) {
  errors.forEach(({ field, message }) => {
    if (field) {
      setError(field as keyof T, { type: 'manual', message });
    }
  });
}
