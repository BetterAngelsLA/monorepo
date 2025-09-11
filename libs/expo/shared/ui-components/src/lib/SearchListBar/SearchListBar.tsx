import { useEffect, useRef } from 'react';
import { TextInputProps, ViewStyle } from 'react-native';
import { SearchBar } from '../SearchBar';
import { useTextFilter } from './useTextFilter';

type TProps<T> = Omit<TextInputProps, 'value' | 'onChange' | 'onChangeText'> & {
  data: T[];
  extractSearchText: (item: T) => string;
  initialQuery?: string;
  onChange: (items: T[]) => void;
  onClear?: () => void;
  placeholder?: string;
  style?: ViewStyle;
  caseSensitive?: boolean;
};

export function SearchListBar<T>(props: TProps<T>) {
  const {
    initialQuery = '',
    data,
    extractSearchText,
    placeholder = 'Search',
    onChange,
    onClear,
    style,
    caseSensitive,
    ...textInputRest
  } = props;

  // Local-only filtering & query state
  const { filtered, query, setQuery, signature } = useTextFilter<T>({
    data,
    extractSearchText,
    caseSensitive,
    initialQuery,
  });

  // refs to stabilize onChange calls
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onChangeRef.current(filtered);
  }, [signature]);

  return (
    <SearchBar
      style={style}
      value={query}
      placeholder={placeholder}
      onChange={(text) => setQuery(text)}
      onClear={() => {
        setQuery('');
        onClear?.();
      }}
      debounceMs={0} // local-only - no debounce
      {...textInputRest}
    />
  );
}
