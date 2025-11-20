export function asNumber(value: unknown, fallback = NaN): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  const n = Number(value.trim());

  return Number.isFinite(n) ? n : fallback;
}

export function asNonNegativeInteger(value: unknown, fallback = 0): number {
  const n = Math.floor(asNumber(value, fallback));

  if (!Number.isFinite(n) || n < 0) {
    return fallback;
  }

  return n;
}

export function toNonNegativeInteger(value: unknown): number | undefined {
  const n = Number(value);

  if (Number.isInteger(n) && n >= 0) {
    return n;
  }

  return undefined;
}

export function toNonNegativeIntegerOrFallback(
  value: unknown,
  fallback: number
): number {
  return toNonNegativeInteger(value) || fallback;
}
