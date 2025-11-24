import { isNonNullable } from './isNonNullable';

export function toOptionalString(value: unknown): string | undefined {
  return isNonNullable(value) ? String(value) : undefined;
}
