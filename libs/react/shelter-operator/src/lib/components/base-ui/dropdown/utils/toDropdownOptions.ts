import { DropdownOption } from '../types';

export function toDropdownOptions<T extends string | number>(
  map: Record<T, string>
): DropdownOption<T>[] {
  return (Object.entries(map) as [T, string][]).map(([value, label]) => ({
    value,
    label,
  }));
}
