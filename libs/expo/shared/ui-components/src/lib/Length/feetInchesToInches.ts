export function feetInchesToInches(feet: string, inches: string): number {
  const feetNum = parseInt(feet, 10) || 0;
  const inchesNum = parseInt(inches, 10) || 0;
  return feetNum * 12 + inchesNum;
}
