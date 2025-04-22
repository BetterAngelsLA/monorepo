export function validateAsEnum<T extends object>(
  value: any,
  enumObj: T
): value is T[keyof T] {
  return Object.values(enumObj).includes(value);
}
