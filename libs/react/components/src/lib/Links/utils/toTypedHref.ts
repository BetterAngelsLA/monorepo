import { TLinkType } from '../types';

export function toTypedHref(href: string, type?: TLinkType) {
  if (type === 'tel') {
    return `tel:${href}`;
  }

  if (type === 'email') {
    return `mailto:${href}`;
  }

  return href;
}
