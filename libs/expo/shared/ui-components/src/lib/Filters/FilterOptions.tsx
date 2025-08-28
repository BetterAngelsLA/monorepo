import { pagePaddingHorizontal } from '@monorepo/expo/betterangels';
import { Spacings } from '@monorepo/expo/shared/static';
import { Button, MultiSelect } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TFilterOption = {
  id: string;
  label: string;
};

type TFilterOptions = {
  onSelected: (filters: TFilterOption[]) => void;
  options: TFilterOption[];
  initalSelected: TFilterOption[];
  title?: string;
};

const paginationLimit = 25;

export default function FilterOptions(props: TFilterOptions) {
  const { options, initalSelected, onSelected, title } = props;

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
    <View style={[{ paddingBottom: 35 + bottomOffset }, styles.container]}>
      <ScrollView
        // onScroll={handleScroll}
        // scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
      >
        <MultiSelect
          style={styles.multiSelect}
          filterPlaceholder="Search"
          withFilter
          title={title}
          search={search}
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
    paddingHorizontal: pagePaddingHorizontal,
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
