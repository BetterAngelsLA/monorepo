import { X } from 'lucide-react';
import { Text } from '../text/text';
import type { DropdownOption } from './types';

interface DropdownChipsProps<T extends string | number> {
  selectedValues: DropdownOption<T>[];
  onRemove: (option: DropdownOption<T>) => void;
}

export function DropdownChips<T extends string | number>({
  selectedValues,
  onRemove,
}: DropdownChipsProps<T>) {
  return (
    <div className="flex min-w-0 flex-1 flex-row flex-wrap content-start items-center gap-1 font-sans">
      {selectedValues.map((v) => (
        <span
          key={v.value}
          className="group inline-flex max-w-full min-w-0 items-center gap-0 rounded-full bg-gray-100 px-3 py-1 transition-[gap] duration-200 hover:gap-1"
        >
          <Text
            variant="tag"
            className="truncate text-gray-600 transition-colors duration-200 group-hover:text-gray-900"
          >
            {v.label}
          </Text>
          <button
            type="button"
            aria-label={`Remove ${v.label}`}
            className="min-w-0 max-w-0 shrink-0 overflow-hidden p-0 leading-none text-gray-900 opacity-0 outline-hidden transition-all duration-200 focus:outline-hidden group-hover:max-w-4 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onRemove(v);
            }}
          >
            <Text variant="tag" className="text-gray-900">
              <X size={17} className="shrink-0" />
            </Text>
          </button>
        </span>
      ))}
    </div>
  );
}
