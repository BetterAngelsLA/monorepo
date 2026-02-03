export const compactEnumValues = <T extends string>(values: readonly T[] | undefined): T[] => {
  if (!values?.length) {
    return [];
  }

  return Array.from(new Set(values.filter((value): value is T => Boolean(value))));
};
