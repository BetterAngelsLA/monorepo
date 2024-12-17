import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function mergeCss(classes: ClassValue[]) {
  return twMerge(clsx(...classes));
}
