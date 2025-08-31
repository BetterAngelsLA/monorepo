import { Spacings } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../Button';
import { MultiSelect } from '../MultiSelect';
import { TFilterOption } from './types';

type TFilterOptions = {
  onSelected: (filters: TFilterOption[]) => void;
  onSearch?: (search: string) => void;
  searchDebounceMs?: number;
  options: TFilterOption[];
  initalSelected: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  style?: StyleProp<ViewStyle>;
};

const paginationLimit = 25;

export function FilterOptions(props: TFilterOptions) {
  const {
    options,
    initalSelected,
    onSelected,
    onSearch,
    searchDebounceMs,
    title,
    searchPlaceholder,
    style,
  } = props;

  const [selected, setSelected] = useState<TFilterOption[]>(initalSelected);
  const [search, setSearch] = useState<string>('');

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

  const handleOnDone = () => {
    onSelected(selected);
  };

  const handleClearBoxes = () => {
    setSelected([]);
  };

  return (
    <View
      style={[{ paddingBottom: 35 + bottomOffset }, styles.container, style]}
    >
      <ScrollView
        // onScroll={handleScroll}
        // scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
      >
        <MultiSelect
          style={styles.multiSelect}
          filterPlaceholder={searchPlaceholder}
          withFilter
          title={title}
          search={search}
          onSearch={onSearch}
          searchDebounceMs={searchDebounceMs}
          //   onSearch={(query) => {
          //     console.log('*****************  Search Result:', query);
          //     setSearch(query);
          //   }}
          //   onChange={(e: { id: string; label: string }[]) => setSelected(e)}
          onChange={setSelected}
          options={options}
          selected={selected}
          valueKey="id"
          labelKey="label"
        />
      </ScrollView>

      <View style={styles.buttonRow}>
        <Button
          onPress={handleClearBoxes}
          size="md"
          title="Clear"
          variant="secondary"
          accessibilityHint="clear all selections"
        />

        <Button
          onPress={handleOnDone}
          size="md"
          title="Done"
          variant="primary"
          accessibilityHint="apply selections filter"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacings.lg,
    paddingHorizontal: Spacings.sm,
    paddingTop: Spacings.lg,
  },
  multiSelect: {
    paddingBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
});
