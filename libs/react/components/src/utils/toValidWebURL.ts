import isWebsite from './isWebsite';

export default function toValidWebURL(value: string): string {
  if (isWebsite(value)) {
    return value;
  }

  return `https://${value}`;
}
