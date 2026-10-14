import { mergeCss } from '@monorepo/react/shared';
import { Check, X } from 'lucide-react';
import { Text } from '../../text/text';

export type ColumnFilterOption = {
  label: string;
  value: string;
};

type ColumnFilterProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  className?: string;
  inputClassName?: string;
  /** Predefined filter values the user can click to select instead of typing. */
  filterOptions?: ColumnFilterOption[];
};

export function ColumnFilter(props: ColumnFilterProps) {
  const { value, onChange, onClear, className, inputClassName, filterOptions } =
    props;

  const hasFilterOptions =
    filterOptions !== undefined && filterOptions.length > 0;

  const parentCss = [
    'absolute',
    'top-full',
    '-left-8',
    'mt-1',
    'bg-white',
    'border',
    'border-gray-200',
    hasFilterOptions ? 'rounded-2xl' : 'rounded-full pr-2',
    'shadow-lg',
    'flex',
    'flex-col',
    'min-w-[180px]',
    'max-w-[280px]',
    className,
  ];

  const inputCss = [
    'w-full',
    'h-9',
    'text-sm',
    'px-5',
    'placeholder:text-[#B0B5BD]',
    'focus:outline-none',
    'focus:border-[#008CEE]',
    inputClassName,
  ];

  return (
    <div className={mergeCss(parentCss)} onClick={(e) => e.stopPropagation()}>
      {!hasFilterOptions && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="Filter…"
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={mergeCss(inputCss)}
          />
          <button
            type="button"
            onClick={onClear}
            className="text-[#B0B5BD] hover:text-[#747A82] flex-shrink-0 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {hasFilterOptions && (
        <>
          <div className="space-y-1 overflow-y-auto px-2 py-2">
            {filterOptions.map((option) => {
              const isActive = value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange(isActive ? '' : option.value)}
                  className={mergeCss([
                    'cursor-pointer rounded-lg px-3 py-2.5 transition-colors w-full text-left',
                    isActive ? 'bg-blue-50' : 'hover:bg-gray-50',
                  ])}
                >
                  <Text
                    variant="body"
                    className={mergeCss([
                      'flex items-center justify-between gap-2 min-w-0',
                      isActive ? 'text-[#008CEE]' : 'text-gray-900',
                    ])}
                  >
                    <span className="truncate text-sm">{option.label}</span>
                    {isActive && <Check size={18} className="shrink-0" />}
                  </Text>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end px-4 py-1.5 border-t border-gray-200">
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-sans text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}
