import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function mergeCss(classes?: ClassValue[] | string) {
  if (!classes) {
    return '';
  }

  if (typeof classes === 'string') {
    return classes;
  }

  return twMerge(clsx(...classes));
}
