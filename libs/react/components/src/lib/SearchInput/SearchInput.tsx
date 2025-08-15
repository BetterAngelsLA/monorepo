import { SearchIcon } from '@monorepo/react/icons';
import { debounce } from '@monorepo/react/shared';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '../../../../components/src/lib/Input';

export type TProps = {
  value: string;
  label?: string;
  error?: string;
  placeholder?: string;
  onChange: (text: string) => void;
  debounceMs?: number;
  className?: string;
};

export function SearchInput(props: TProps) {
  const {
    value,
    label,
    placeholder = 'Search',
    error,
    debounceMs = 0,
    onChange,
    className,
  } = props;

  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const debouncedChange = useMemo(
    () => debounce(onChange, debounceMs),
    [onChange, debounceMs]
  );

  useEffect(() => {
    return () => {
      debouncedChange.cancel();
    };
  }, [debouncedChange]);

  return (
    <Input
      className={className}
      label={label}
      placeholder={placeholder}
      value={internalValue}
      error={error}
      onChange={(e) => {
        const text = e.target.value;

        setInternalValue(text);

        if (debounceMs > 0) {
          debouncedChange(text);
        } else {
          onChange(text);
        }
      }}
      iconBefore={<SearchIcon className="h-4" />}
    />
  );
}
