import { X } from 'lucide-react';
import { Text } from '../text/text';
import type { DropdownOption } from './types';

interface DropdownChipsProps<T extends string | number> {
  selectedValues: DropdownOption<T>[];
  onRemove: (option: DropdownOption<T>) => void;
  stacked: boolean;
}

export function DropdownChips<T extends string | number>({
  selectedValues,
  onRemove,
  stacked,
}: DropdownChipsProps<T>) {
  return (
    <div
      className={`flex gap-2 flex-1 min-w-0 ${
        stacked ? 'flex-col' : 'flex-row items-center min-h-0'
      }`}
    >
      {selectedValues.map((v) => (
        <span
          key={v.value}
          className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-200 min-w-0 max-w-full self-start"
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
