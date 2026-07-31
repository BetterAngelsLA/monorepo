import { DropdownOption } from '../types';

export function getSelectedDropdownOptions<T extends string>(
  values: ReadonlyArray<{ name?: T | null }>,
  options: ReadonlyArray<{ value: T; label: string }>
): DropdownOption<T>[] {
  const selected = new Set(
    values.map((v) => v.name).filter((n): n is T => n != null)
  );

  return options.filter((option) => selected.has(option.value));
}
