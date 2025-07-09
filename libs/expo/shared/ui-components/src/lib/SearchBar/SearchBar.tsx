import { SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { debounce } from '@monorepo/expo/shared/utils';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInputProps, View, ViewStyle } from 'react-native';
import BasicInput from '../BasicInput';

type TProps = Omit<TextInputProps, 'value' | 'onChange' | 'onChangeText'> & {
  value: string;
  placeholder?: string;
  onChange: (text: string) => void;
  onClear?: () => void;
  debounceMs?: number; // set to 0 to disable
  style?: ViewStyle;
};

export function SearchBar(props: TProps) {
  const {
    value,
    debounceMs = 500,
    placeholder = 'Search',
    onChange,
    onClear,
    style,
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
    <View style={[styles.container, style]}>
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
        icon={<SearchIcon ml="sm" color={Colors.NEUTRAL} />}
        {...textInputRest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
