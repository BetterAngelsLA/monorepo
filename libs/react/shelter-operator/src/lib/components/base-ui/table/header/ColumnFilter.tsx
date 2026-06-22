import { mergeCss } from '@monorepo/react/shared';
import { X } from 'lucide-react';

type ColumnFilterProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  className?: string;
  inputClassName?: string;
};

export function ColumnFilter(props: ColumnFilterProps) {
  const { value, onChange, onClear, className, inputClassName } = props;

  const parentCss = [
    'absolute',
    'bottom-full',
    '-left-8',
    'mb-1',
    'bg-white',
    'border',
    'border-gray-200',
    'rounded-full',
    'shadow-lg',
    'pr-2',
    'flex',
    'items-center',
    'gap-1',
    'min-w-[180px]',
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
  );
}
