import { Spacings } from '@monorepo/expo/shared/static';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { ReactElement, useCallback } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { SearchBar } from '../SearchBar';
import TextBold from '../TextBold';
import TextMedium from '../TextMedium';
import TextRegular from '../TextRegular';
import { MultiSelectItem, TMultiSelectItem } from './MultiSelectItem';
// import { NoResultsView } from './NoResultsView';

export interface TMultiSelect<T> {
  style?: StyleProp<ViewStyle>;
  options?: T[];
  selected: T[];
  valueKey: keyof T;
  labelKey: keyof T;
  onChange: (newSelected: T[]) => void;
  title?: string;
  withFilter?: boolean;
  onSearch?: (search: string) => void;
  search?: string;
  searchPlaceholder?: string;
  searchDebounceMs?: number;
  renderOption?: (option: T, props: TMultiSelectItem) => ReactElement;
  totalOptions?: number;
  loadMore?: () => void;
  loading?: boolean;
  estimatedItemSize?: number;
  itemGap?: number;
}

export function MultiSelectInfinite<T>(props: TMultiSelect<T>) {
  const {
    style,
    options,
    selected = [],
    valueKey,
    labelKey,
    onChange,
    onSearch,
    search,
    searchDebounceMs,
    title,
    searchPlaceholder = 'Search',
    renderOption,
    loadMore,
    totalOptions,
    loading,
    estimatedItemSize,
    itemGap = Spacings.xs,
  } = props;
  function isSelected(option: T): boolean {
    return !!selected.find((item) => {
      return item[valueKey] === option[valueKey];
    });
  }

  const toggleChecked = (item: T) => {
    // uncheck
    if (isSelected(item)) {
      const newSelectedItems = selected.filter((prevItem) => {
        return item[valueKey] !== prevItem[valueKey];
      });

      return onChange(newSelectedItems);
    }

    // check
    return onChange([...selected, item]);
  };

  const renderItemFn: ListRenderItem<T> = useCallback(
    ({ item }: { item: T }) => {
      const isChecked = isSelected(item);
      const label = String(item[labelKey] ?? '');
      const onClick = () => toggleChecked(item);
      const accessibilityHint = isChecked
        ? `uncheck option: ${label}`
        : `check option: ${label}`;
      const testId = `MultiSelect-option-${label.replace(/\s+/g, '-')}`;

      const optionProps = {
        isChecked,
        onClick,
        label,
        accessibilityHint,
        testId,
      };

      if (renderOption) {
        return renderOption(item, optionProps);
      }

      return (
        <MultiSelectItem
          isChecked={isChecked}
          onClick={onClick}
          label={label}
          accessibilityHint={accessibilityHint}
          testId={testId}
        />
      );
    },
    [isSelected, toggleChecked, valueKey, labelKey]
  );

  return (
    <View style={[{ flex: 1 }, style]}>
      {!!title && (
        <TextBold size="lg" mb="xs">
          {title}
        </TextBold>
      )}

      {!!onSearch && (
        <SearchBar
          debounceMs={searchDebounceMs}
          value={search || ''}
          onClear={() => onSearch('')}
          onChange={onSearch}
          placeholder={searchPlaceholder}
          style={{ marginBottom: Spacings.lg }}
        />
      )}

      {!loading && options && !!totalOptions && (
        <TextMedium size="sm" mb="sm">
          Displaying {options.length} of {totalOptions} options
        </TextMedium>
      )}

      <FlashList<T>
        estimatedItemSize={estimatedItemSize || 64}
        data={options}
        extraData={selected}
        keyExtractor={(item) => String(item[valueKey])}
        renderItem={renderItemFn}
        onEndReached={loadMore}
        onEndReachedThreshold={0.05}
        ItemSeparatorComponent={() => <View style={{ height: itemGap }} />}
        // ListEmptyComponent={() => (loading ? null : <NoResultsView />)}
        // small footer helps ensure there’s space to hit the end
        ListFooterComponent={
          loading ? (
            <TextRegular mt="lg" size="md" textAlign="center">
              Loading…
            </TextRegular>
          ) : (
            <View style={{ height: 16 }} />
          )
        }
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
