export function toNonNegativeIntegerOrFallback(
  value: unknown,
  fallback: number
): number {
  const n = Number(value);

  if (Number.isInteger(n) && n >= 0) {
    return n;
  }

  return fallback;
}
