type TPrimitive =
  | string
  | number
  | boolean
  | null
  | undefined
  | symbol
  | bigint;

export function toggleValueInArray<T extends TPrimitive>(
  list: T[],
  value: T
): T[] {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }

  return [...list, value];
}
