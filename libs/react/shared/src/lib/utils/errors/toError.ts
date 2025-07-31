export function toError(value: any): Error {
  if (value instanceof Error) {
    return value;
  }

  return new Error(String(value));
}
