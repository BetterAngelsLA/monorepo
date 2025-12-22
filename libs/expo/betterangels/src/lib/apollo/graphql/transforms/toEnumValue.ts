export function toEnumValue<TEnum extends string>(
  enumObject: Record<string, TEnum>,
  value: string
): TEnum | undefined {
  if (Object.values(enumObject).includes(value as TEnum)) {
    return value as TEnum;
  }

  return undefined;
}
