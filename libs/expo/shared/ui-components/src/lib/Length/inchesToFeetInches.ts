export function inchesToFeetInches(heightInInches: number): {
  feet: string;
  inches: string;
} {
  const feet = Math.floor(heightInInches / 12).toString();
  const inches = (heightInInches % 12).toString();
  return { feet, inches };
}
