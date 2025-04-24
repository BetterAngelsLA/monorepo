import validator from 'validator';

export function isValidURL(value: string): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;

  return validator.isURL(value, {
    protocols: ['http', 'https'],
    require_protocol: false,
    require_tld: true,
    allow_underscores: false,
  });
}
