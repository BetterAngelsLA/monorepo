import { X } from 'lucide-react';
import { Text } from '../text/text';
import type { DropdownOption } from './types';

/** Maximum number of chip pills shown before the "+N" badge. */
const MAX_VISIBLE_CHIPS = 2;

interface DropdownChipsProps<T extends string | number> {
  selectedValues: DropdownOption<T>[];
  onRemove: (option: DropdownOption<T>) => void;
}

export function DropdownChips<T extends string | number>({
  selectedValues,
  onRemove,
}: DropdownChipsProps<T>) {
  return (
    <div className="absolute inset-0 flex items-center pl-4 pr-10 gap-2">
      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
        {selectedValues.slice(0, MAX_VISIBLE_CHIPS).map((v) => (
          <span
            key={v.value}
            className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-200 whitespace-nowrap shrink-0"
          >
            <Text variant="tag" className="text-gray-700">
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
      {selectedValues.length > MAX_VISIBLE_CHIPS && (
        <span className="px-2 py-1 bg-gray-200 rounded-full whitespace-nowrap shrink-0">
          <Text variant="tag" className="text-gray-500">
            +{selectedValues.length - MAX_VISIBLE_CHIPS}
          </Text>
        </span>
      )}
    </div>
  );
}
