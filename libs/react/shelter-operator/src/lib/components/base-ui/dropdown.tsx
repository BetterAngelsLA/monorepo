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
  const {
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
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stagedValues, setStagedValues] = useState<DropdownOption[]>([]);

  const selectedValues: DropdownOption[] = value
    ? Array.isArray(value)
      ? value
      : [value]
    : [];

  return (
    <div>
      <p>{label}</p>
      <p>{placeholder}</p>
    </div>
  );
}
