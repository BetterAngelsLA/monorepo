import { mergeCss } from '@monorepo/react/shared';
import { X } from 'lucide-react';
import { Text } from '../text/text';
import type { DropdownOption } from './types';

interface DropdownChipProps<T extends string | number> {
  option: DropdownOption<T>;
  onRemove?: (option: DropdownOption<T>) => void;
  colorMap?: Partial<Record<T, string>>;
}

export function DropdownChip<T extends string | number>({
  option,
  onRemove,
  colorMap,
}: DropdownChipProps<T>) {
  const removable = typeof onRemove === 'function';
  const colorClass = colorMap?.[option.value];

  return (
    <span
      className={mergeCss([
        'group inline-flex max-w-full min-w-0 items-center gap-0 rounded-full px-3 py-1',
        colorClass ?? 'bg-gray-100',
        removable && 'transition-[gap] duration-200 hover:gap-1',
      ])}
    >
      <Text
        variant="tag"
        className={mergeCss([
          'truncate text-gray-600 ',
          removable &&
            'transition-colors duration-200 group-hover:text-gray-900',
        ])}
      >
        {option.label}
      </Text>

      {removable && (
        <button
          type="button"
          aria-label={`Remove ${option.label}`}
          className="min-w-0 max-w-0 shrink-0 overflow-hidden p-0 leading-none text-gray-900 opacity-0 outline-hidden transition-all duration-200 focus:outline-hidden group-hover:max-w-4 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove(option);
          }}
        >
          <Text variant="tag" className="text-gray-900">
            <X size={17} className="shrink-0" />
          </Text>
        </button>
      )}
    </span>
  );
}
