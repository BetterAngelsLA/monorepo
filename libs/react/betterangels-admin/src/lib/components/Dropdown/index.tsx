import { ReactElement, useEffect, useRef, useState } from 'react';
import './index.css';

type DropdownProps<T extends string> = {
  options: T[];
  onSelect: (option: T) => void;
  className?: string;
  position?: 'dropdown-start' | 'dropdown-end' | 'dropdown-center';
  title: string | ReactElement;
};

export default function Dropdown<T extends string>({
  options,
  onSelect,
  className = '',
  position = 'dropdown-end',
  title,
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
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <div
        className="m-1 cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
      >
        {title}
      </div>
      {open && (
        <ul
          className={`
            absolute mt-2 min-w-[12rem]
            rounded-2xl bg-white shadow-sm p-2 z-50
            ${position === 'dropdown-end' ? 'right-0' : ''}
            ${position === 'dropdown-start' ? 'left-0' : ''}
            ${position === 'dropdown-center' ? 'left-1/2 -translate-x-1/2' : ''}
          `}
        >
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
      )}
    </div>
  );
}
