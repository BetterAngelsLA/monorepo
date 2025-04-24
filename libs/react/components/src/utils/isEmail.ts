import validator from 'validator';

export function isEmail(value: string): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;

  return validator.isEmail(value);
}
