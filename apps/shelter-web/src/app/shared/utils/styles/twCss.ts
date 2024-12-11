import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function twCss(classes: ClassValue[]): any {
  return twMerge(clsx(...classes));
}
