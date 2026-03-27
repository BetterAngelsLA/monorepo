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
          className="group inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-2xl bg-gray-200 px-3 py-1"
        >
          <Text variant="tag" className="text-gray-700 truncate">
            {v.label}
          </Text>
          <button
            type="button"
            aria-label={`Remove ${v.label}`}
            className="w-4 leading-none outline-hidden focus:outline-hidden shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onRemove(v);
            }}
          >
            <Text variant="tag" className="text-gray-400 hover:text-red-500">
              <X size={16} />
            </Text>
          </button>
        </span>
      ))}
    </div>
  );
}
