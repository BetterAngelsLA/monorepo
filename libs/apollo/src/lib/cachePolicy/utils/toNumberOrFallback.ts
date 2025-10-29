export function toNumberOrFallback(value: unknown, fallback: number): number {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric;
  }

  return fallback;
}
