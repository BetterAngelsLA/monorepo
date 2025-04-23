import validator from 'validator';

export default function isWebsite(value: string) {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  return validator.isURL(value, {
    protocols: ['http', 'https'],
    require_protocol: false,
    require_tld: true,
  });
}
