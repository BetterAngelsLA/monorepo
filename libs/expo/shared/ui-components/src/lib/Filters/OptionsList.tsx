import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { MultiSelect } from '../MultiSelect';
import { TFilterOption } from './types';

type TProps = {
  onChange: (filters: TFilterOption[]) => void;
  onSearch?: (search: string) => void;
  searchQuery?: string;
  searchDebounceMs?: number;
  options: TFilterOption[];
  selected: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  style?: StyleProp<ViewStyle>;
};

export function OptionsList(props: TProps) {
  const {
    options,
    selected,
    onChange,
    onSearch,
    searchQuery,
    searchDebounceMs,
    title,
    searchPlaceholder,
    style,
  } = props;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <MultiSelect
        style={[styles.multiSelect, style]}
        searchPlaceholder={searchPlaceholder}
        withFilter
        title={title}
        search={searchQuery}
        onSearch={onSearch}
        onChange={onChange}
        searchDebounceMs={searchDebounceMs}
        options={options}
        selected={selected}
        valueKey="id"
        labelKey="label"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  multiSelect: {
    paddingBottom: 40,
  },
});
