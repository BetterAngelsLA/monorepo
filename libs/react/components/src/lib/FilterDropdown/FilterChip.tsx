type FilterChipProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  activeClassName?: string;
  className?: string;
};

export function FilterChip({
  label,
  active = false,
  onClick,
  activeClassName = 'bg-tags-main text-black',
  className = '',
}: FilterChipProps) {
  const baseStyles =
    'px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors select-none';
  const stateStyles = active
    ? activeClassName
    : 'bg-neutral-warm-95 text-neutral-warm-50';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyles} ${stateStyles} ${className}`}
    >
      {label}
    </button>
  );
}
