import { DropdownChip } from './DropdownChip';
import type { DropdownOption } from './types';

interface DropdownChipsProps<T extends string | number> {
  selectedValues: DropdownOption<T>[];
  onRemove?: (option: DropdownOption<T>) => void;
  colorMap?: Partial<Record<T, string>>;
}

export function DropdownChips<T extends string | number>({
  selectedValues,
  onRemove,
  colorMap,
}: DropdownChipsProps<T>) {
  return (
    <div className="flex min-w-0 flex-1 flex-row flex-wrap content-start items-center gap-1 font-sans">
      {selectedValues.map((v) => (
        <DropdownChip
          key={v.value}
          option={v}
          onRemove={onRemove}
          colorMap={colorMap}
        />
      ))}
    </div>
  );
}
