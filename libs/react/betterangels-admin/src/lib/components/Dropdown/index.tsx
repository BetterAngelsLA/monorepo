import { ReactElement } from 'react';
import './index.css';

export default function Dropdown({
  options,
  onSelect,
  className = '',
  position = 'dropdown-end',
  title,
}: {
  options: string[];
  onSelect: (option: string) => void;
  className?: string;
  position?: 'dropdown-start' | 'dropdown-end' | 'dropdown-center';
  title: string | ReactElement;
}) {
  return (
    <div className={`dropdown ${position} ${className}`}>
      <div tabIndex={0} className="m-1 cursor-pointer">
        {title}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-white rounded-2xl z-[1] w-52 p-2 shadow-sm"
      >
        {options.map((option) => (
          <li key={option}>
            <button
              className={`text-sm text-primary-20`}
              onClick={() => onSelect(option)}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
