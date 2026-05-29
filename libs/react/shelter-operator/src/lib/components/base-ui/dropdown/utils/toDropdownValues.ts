export function toDropdownValues<T extends string | number>(
  items: { name?: T | null | undefined }[]
): T[] {
  return items.reduce<T[]>((acc, item) => {
    if (item.name != null) acc.push(item.name);
    return acc;
  }, []);
}
