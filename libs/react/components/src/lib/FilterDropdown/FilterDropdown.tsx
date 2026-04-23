import { ReactNode, useEffect, useRef, useState } from 'react';

export type FilterDropdownProps = {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  position?: 'dropdown-start' | 'dropdown-end' | 'dropdown-center';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function FilterDropdown({
  title,
  children,
  className = '',
  position = 'dropdown-start',
  open: controlledOpen,
  onOpenChange,
}: FilterDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  function setOpen(value: boolean) {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
      onOpenChange?.(value);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const positionClass =
    position === 'dropdown-end'
      ? 'right-0'
      : position === 'dropdown-center'
      ? 'left-1/2 -translate-x-1/2'
      : 'left-0';

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <div className="cursor-pointer" onClick={() => setOpen(!open)}>
        {title}
      </div>
      {open && (
        <div
          className={`absolute mt-2 min-w-[20rem] max-h-[22rem] overflow-y-auto scrollbar-thin rounded-2xl bg-white shadow-md border border-neutral-90 p-4 z-50 ${positionClass}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
