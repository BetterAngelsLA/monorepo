import { useState } from 'react';

export interface DropdownOption {
  label: string;
  value: string | number;
}

export interface DropdownProps {
  label: string;
  placeholder: string;
  options: DropdownOption[];
  value: string | number | Array<string | number>;
  onChange: (value: string | number | Array<string | number>) => void;
  isMulti?: boolean;
  isSearchable?: boolean;
  hasFooter?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Dropdown = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  isMulti = false,
  isSearchable = false,
  hasFooter = false,
  disabled = false,
  className,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedValues: Array<string | number> =
    value === undefined || value === null
      ? []
      : Array.isArray(value)
      ? value
      : [value];

  return (
    <div className={className}>
      <p>{label}</p>
      <p>{placeholder}</p>
    </div>
  );
};
