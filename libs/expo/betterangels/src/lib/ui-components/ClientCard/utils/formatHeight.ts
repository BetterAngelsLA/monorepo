export function formatHeight(inches: number): string | null {
  if (!Number.isFinite(inches) || inches <= 0) {
    return null;
  }

  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;

  return `${feet}' ${remainingInches}"`;
}
