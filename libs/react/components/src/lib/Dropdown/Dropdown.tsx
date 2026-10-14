import { mergeCss } from '@monorepo/react/shared';
import { ReactElement, ReactNode, useEffect, useRef, useState } from 'react';

export type DropdownProps<T extends string> = {
  options: T[];
  onSelect: (option: T) => void;
  className?: string;
  position?: 'dropdown-start' | 'dropdown-end' | 'dropdown-center';
  title: string | ReactElement;
  sheetClassname?: string;
  /** Non-interactive content rendered above the options (e.g. account details). */
  header?: ReactNode;
  headerClassname?: string;
  /** Non-interactive content rendered below the options (e.g. session context). */
  footer?: ReactNode;
  footerClassname?: string;
};

export function Dropdown<T extends string>({
  options,
  onSelect,
  className = '',
  position = 'dropdown-end',
  title,
  sheetClassname,
  header,
  footer,
  headerClassname,
  footerClassname,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={mergeCss(['relative inline-block', className])}
    >
      <div
        className="m-1 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((prev) => !prev);
          }

          if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      >
        {title}
      </div>
      {open && (
        <div
          className={mergeCss([
            'absolute mt-2 min-w-48',
            'rounded-2xl bg-white shadow-xs p-2 z-200',
            position === 'dropdown-end' && 'right-0',
            position === 'dropdown-start' && 'left-0',
            position === 'dropdown-center' && 'left-1/2 -translate-x-1/2',
            sheetClassname,
          ])}
        >
          {header && (
            <div className={mergeCss(['mb-1', headerClassname])}>{header}</div>
          )}

          <ul>
            {options.map((option) => (
              <li key={option}>
                <button
                  className="text-sm text-primary-20 w-full text-left px-4 py-2 rounded-lg hover:bg-neutral-98"
                  onClick={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>

          {footer && (
            <div className={mergeCss(['mt-1', footerClassname])}>{footer}</div>
          )}
        </div>
      )}
    </div>
  );
}
