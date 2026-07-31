import { DropdownOption } from '../types';

export function toDropdownValues<T extends string | number>(
  items: { name?: T | null | undefined }[]
): T[] {
  return items.reduce<T[]>((acc, item) => {
    if (item.name != null) acc.push(item.name);
    return acc;
  }, []);
}

export function toDropdownValue<T extends string | number>(
  value: T,
  map: Record<T, string>
): DropdownOption<T> {
  return { value, label: map[value] };
}
