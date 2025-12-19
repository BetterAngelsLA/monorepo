import { toEnum } from './toEnum';

export function toEnumArray<T extends string>(
  enumObject: Record<string, T>,
  arr?: string[]
): T[] | undefined {
  if (!arr || !arr.length) {
    return undefined;
  }

  const enumArr: T[] = [];

  for (const item of arr) {
    const validEnum = toEnum<T>(enumObject, item);

    if (!validEnum) {
      continue;
    }

    enumArr.push(validEnum);
  }

  if (!enumArr.length) {
    return undefined;
  }

  return enumArr;
}
