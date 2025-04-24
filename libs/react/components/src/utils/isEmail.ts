import validator from 'validator';

export function isEmail(value: string): boolean {
  return validator.isEmail(value);
}
