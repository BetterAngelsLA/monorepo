import { Spacings } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MultiSelectInfinite } from '../MultiSelect';
import { FilterActionButtons } from './FilterActionButton';
import { OptionsList } from './OptionsList';
import { TFilterOption } from './types';

type TBaseFilterOptions = {
  type?: 'default' | 'infinite';
  onSelected: (filters: TFilterOption[]) => void;
  onSearch?: (search: string) => void;
  skipSearch?: boolean;
  searchQuery?: string;
  searchDebounceMs?: number;
  options: TFilterOption[];
  initialSelected: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  itemGap?: number;
  style?: StyleProp<ViewStyle>;
};

export type TDefaultFilterOptions = TBaseFilterOptions & {
  type?: 'default';
};

type TInfiniteFilterOptions = TBaseFilterOptions & {
  type: 'infinite';
  loadMore: () => void;
  totalOptions?: number;
  loading?: boolean;
};

type TFilterOptions = TDefaultFilterOptions | TInfiniteFilterOptions;

export function FilterOptions(props: TFilterOptions) {
  const { type, initialSelected, onSelected, style, ...rest } = props;

  const [selected, setSelected] = useState<TFilterOption[]>(initialSelected);
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

  const handleOnDone = () => {
    onSelected(selected);
  };

  const handleClearBoxes = () => {
    setSelected([]);
  };

  const infiniteMode = type === 'infinite';

  return (
    <View
      style={[{ paddingBottom: 35 + bottomOffset }, styles.container, style]}
    >
      {!infiniteMode && (
        <OptionsList onSelected={setSelected} selected={selected} {...rest} />
      )}

      {!!infiniteMode && (
        <MultiSelectInfinite<TFilterOption>
          onChange={setSelected}
          selected={selected}
          valueKey="id"
          labelKey="label"
          {...rest}
        />
      )}

      <FilterActionButtons onDone={handleOnDone} onClear={handleClearBoxes} />
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
});
