import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { MultiSelectInfinite } from '../MultiSelect';
import { TFilterOption } from './types';

export type TProps = {
  onChange: (filters: TFilterOption[]) => void;
  onSearch?: (search: string) => void;
  searchQuery?: string;
  searchDebounceMs?: number;
  options: TFilterOption[];
  totalOptions?: number;
  selected: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  loadMore?: () => void;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function OptionsListInfinite(props: TProps) {
  const {
    options,
    selected,
    onChange,
    onSearch,
    searchQuery,
    searchDebounceMs,
    loadMore,
    loading,
    totalOptions,
    title,
    searchPlaceholder,
    style,
  } = props;

  return (
    <MultiSelectInfinite<TFilterOption>
      style={[styles.container, style]}
      title={title}
      search={searchQuery}
      onSearch={onSearch}
      searchPlaceholder={searchPlaceholder}
      searchDebounceMs={searchDebounceMs}
      onChange={onChange}
      options={options}
      selected={selected}
      loadMore={loadMore}
      totalOptions={totalOptions}
      loading={loading}
      valueKey="id"
      labelKey="label"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
});
