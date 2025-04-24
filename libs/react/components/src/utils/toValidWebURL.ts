import { isValidURL } from './isValidURL';

export function toValidWebURL(value: string): string {
  if (isValidURL(value)) {
    return value.startsWith('http') ? value : `https://${value}`;
  }
  return '';
}
