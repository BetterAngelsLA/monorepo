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
}

export default function dropdown({ label, placeholder }: DropdownProps) {
  return (
    <div>
      <p>{label}</p>
      <p>{placeholder}</p>
    </div>
  );
}
