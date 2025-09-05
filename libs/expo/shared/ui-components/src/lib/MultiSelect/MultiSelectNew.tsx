import { Spacings } from '@monorepo/expo/shared/static';
import { Fragment, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { InfiniteList } from '../InfiniteList';
import { SearchBar } from '../SearchBar';
import TextBold from '../TextBold';
import TextMedium from '../TextMedium';
import { MultiSelectItem, type TMultiSelectItem } from './MultiSelectItem'; // adjust import
import { MultiSelectProps } from './types';

export function MultiSelectNew<T>(props: MultiSelectProps<T>) {
  const {
    style,
    options = [],
    selected = [],
    valueKey,
    labelKey,
    onChange,
    useVirtualized = true,
    // useVirtualized,
    title,

    // filtering / search
    withFilter,
    onSearch,
    searchQuery = '',
    searchPlaceholder = 'Search',
    searchDebounceMs = 0,

    // pagination
    loadMore,
    loading = false,
    hasMore = false,
    totalOptions,

    // visuals
    estimatedItemSize, // should include for better performance
    itemGap = Spacings.xs,
    contentStyle,
    onEndReachedThreshold,
    showScrollIndicator,

    // customization
    renderOption,
    ListEmptyComponent,
    ListFooterComponent,
    LoadingViewContent,
  } = props;

  // Local (client-side) search text if no onSearch is provided
  const [localSearch, setLocalSearch] = useState('');

  const isSelected = useCallback(
    (opt: T) =>
      selected.some(
        (s) =>
          String((s as any)[valueKey as string]) ===
          String((opt as any)[valueKey as string])
      ),
    [selected, valueKey]
  );

  const toggleChecked = useCallback(
    (item: T) => {
      if (isSelected(item)) {
        const updated = selected.filter(
          (prev) => String(prev[valueKey]) !== String(item[valueKey])
        );

        onChange(updated);
      } else {
        onChange([...selected, item]);
      }
    },
    [isSelected, onChange, selected, valueKey]
  );

  const visibleOptions = useMemo(() => {
    if (onSearch || !withFilter) {
      return options;
    }

    const q = localSearch.trim().toLowerCase();

    if (!q) {
      return options;
    }

    return options.filter((opt) => {
      const label = String(opt[labelKey] ?? '').toLowerCase();

      return label.includes(q);
    });
  }, [options, onSearch, withFilter, localSearch, labelKey]);

  const renderRow = useCallback(
    (item: T, idx?: number) => {
      const checked = isSelected(item);
      const label = String(item[labelKey] ?? '');
      const onClick = () => toggleChecked(item);
      const accessibilityHint = checked
        ? `uncheck option: ${label}`
        : `check option: ${label}`;
      const testId = `MultiSelect-option-${label.replace(/\s+/g, '-')}`;

      const optionProps: TMultiSelectItem = {
        isChecked: checked,
        onClick,
        label,
        accessibilityHint,
        testId,
      };

      return renderOption ? (
        renderOption(item, optionProps, idx)
      ) : (
        <MultiSelectItem {...optionProps} />
      );
    },
    [isSelected, labelKey, toggleChecked, renderOption]
  );

  const selectedKey = useMemo(
    () =>
      selected
        .map((s) => String((s as any)[valueKey as string]))
        .sort()
        .join('|'),
    [selected, valueKey]
  );

  const isRemote = !!onSearch;

  const searchValue = isRemote ? searchQuery || '' : localSearch;
  const handleChange = isRemote ? onSearch! : setLocalSearch;

  return (
    <View style={[{ flex: 1, width: '100%' }, style]}>
      {!!title && (
        <TextBold size="lg" mb="xs">
          {title}
        </TextBold>
      )}

      {(onSearch || withFilter) && (
        <SearchBar
          value={searchValue}
          onChange={handleChange}
          onClear={() => handleChange('')}
          placeholder={searchPlaceholder}
          debounceMs={searchDebounceMs}
          style={{ marginBottom: Spacings.lg }}
        />
      )}

      {/* Optional counter for remote lists */}
      {onSearch && totalOptions != null && (
        <TextMedium size="sm" mb="sm">
          Displaying {options.length} of {totalOptions} options
        </TextMedium>
      )}

      {useVirtualized && (
        <InfiniteList<T>
          data={visibleOptions}
          idKey={valueKey as any}
          renderItem={renderRow}
          loadMore={loadMore}
          loading={loading}
          hasMore={hasMore}
          estimatedItemSize={estimatedItemSize}
          itemGap={itemGap}
          extraData={selectedKey}
          // typically can use defaults
          contentStyle={contentStyle}
          onEndReachedThreshold={onEndReachedThreshold}
          showScrollIndicator={showScrollIndicator}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={ListFooterComponent}
          LoadingViewContent={LoadingViewContent}
        />
      )}

      {!useVirtualized && (
        // <View style={{ gap: itemGap }}>
        <View>
          {visibleOptions.map((item, i) => (
            <Fragment key={`${item[valueKey]}-${i}`}>
              {renderRow(item, i)}
            </Fragment>
          ))}
        </View>
      )}
    </View>
  );
}
