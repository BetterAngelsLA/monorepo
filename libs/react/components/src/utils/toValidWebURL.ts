import { isValidURL } from './isValidURL';

export function toValidWebURL(value: string): string {
  if (isValidURL(value)) {
    return value.startsWith('http') ? value : `http://${value}`;
  }
  return '';
}
