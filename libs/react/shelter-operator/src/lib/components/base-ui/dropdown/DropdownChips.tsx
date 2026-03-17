import { X } from 'lucide-react';
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
            className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-200 text-xs text-gray-700 whitespace-nowrap shrink-0"
          >
            {v.label}
            <button
              type="button"
              aria-label={`Remove ${v.label}`}
              className="w-4 leading-none text-gray-400 hover:text-red-500 outline-hidden focus:outline-hidden shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onRemove(v);
              }}
            >
              <X size={16} />
            </button>
          </span>
        ))}
      </div>
      {selectedValues.length > MAX_VISIBLE_CHIPS && (
        <span className="px-2 py-1 rounded-full bg-gray-200 text-xs text-gray-500 whitespace-nowrap shrink-0">
          +{selectedValues.length - MAX_VISIBLE_CHIPS}
        </span>
      )}
    </div>
  );
}
