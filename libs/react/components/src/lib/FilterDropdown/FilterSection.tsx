import { ReactNode } from 'react';

type FilterSectionProps = {
  header: string;
  onClear?: () => void;
  children: ReactNode;
  className?: string;
};

export function FilterSection({
  header,
  onClear,
  children,
  className = '',
}: FilterSectionProps) {
  return (
    <div className={`mt-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-black">{header}</span>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-0.5 text-[10px] text-neutral-warm-70 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
