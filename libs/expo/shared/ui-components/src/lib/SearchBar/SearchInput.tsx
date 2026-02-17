import { SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { debounce } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { TextInputProps } from 'react-native';
import BasicInput from '../BasicInput';

export type TSearchInput = Omit<
  TextInputProps,
  'value' | 'onChange' | 'onChangeText'
> & {
  value: string;
  placeholder?: string;
  onChange: (text: string) => void;
  onClear?: () => void;
  debounceMs?: number; // set to 0 to disable
};

export function SearchInput(props: TSearchInput) {
  const {
    value,
    debounceMs = 500,
    placeholder = 'Search',
    onChange,
    onClear,
    ...textInputRest
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
    <BasicInput
      value={internalValue}
      placeholder={placeholder}
      autoCorrect={false}
      onChangeText={(text) => {
        setInternalValue(text);

        if (debounceMs > 0) {
          debouncedChange(text);
        } else {
          onChange(text);
        }
      }}
      onDelete={() => {
        if (debounceMs > 0) {
          debouncedChange.cancel();
        }

        setInternalValue('');
        onChange('');
        onClear?.();
      }}
      icon={<SearchIcon color={Colors.NEUTRAL} />}
      {...textInputRest}
    />
  );
}
