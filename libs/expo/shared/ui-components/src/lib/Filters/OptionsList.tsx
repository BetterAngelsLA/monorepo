import { ScrollView, StyleSheet } from 'react-native';
import { MultiSelect } from '../MultiSelect';
import { TDefaultFilterOptions } from './FilterOptions';
import { TFilterOption } from './types';

type TProps = Omit<TDefaultFilterOptions, 'initialSelected'> & {
  selected: TFilterOption[];
};

export function OptionsList(props: TProps) {
  const {
    options,
    selected,
    onSelected,
    onSearch,
    skipSearch,
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
        withFilter={!skipSearch}
        title={title}
        search={searchQuery}
        onSearch={onSearch}
        onChange={onSelected}
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
