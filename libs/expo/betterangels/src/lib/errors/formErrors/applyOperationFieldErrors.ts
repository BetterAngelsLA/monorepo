type TOperationError = {
  field?: string | null;
  message: string;
};

export function applyOperationFieldErrors<T>(
  errors: TOperationError[],
  setError: (name: keyof T, error: { type: string; message: string }) => void
) {
  errors.forEach(({ field, message }) => {
    if (field) {
      setError(field as keyof T, { type: 'manual', message });
    }
  });
}
