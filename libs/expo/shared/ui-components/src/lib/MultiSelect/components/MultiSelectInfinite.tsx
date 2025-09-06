import { Spacings } from '@monorepo/expo/shared/static';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { InfiniteList } from '../../InfiniteList';
import { SearchBar, SearchListBar } from '../../SearchBar';
import TextBold from '../../TextBold';
import { getVisibleOptions } from '../getVisibleOptions';
import { MultiSelectInfiniteProps } from '../types';
import { useMultiSelectCore } from '../utils/useMultiSelectCore';
import { useRenderRow } from '../utils/useRenderRow';

export function MultiSelectInfinite<T>(props: MultiSelectInfiniteProps<T>) {
  const {
    // base
    options = [],
    selected,
    onChange,
    valueKey,
    labelKey,
    title,
    style,
    itemGap = Spacings.xs,

    // local “select all”
    withSelectAll,
    selectAllIdx,
    selectAllLabel,
    selectAllValue,

    // row visuals / empty
    renderOption,
    ListEmptyComponent,

    // search (mutually exclusive via types)
    withLocalFilter,
    searchPlaceholder,
    onSearch,
    searchDebounceMs,

    // pass-through for InfiniteList/FlashList
    infiniteProps,
  } = props;

  const hasLocalFilter = withLocalFilter === true;
  const hasServerSearch = typeof onSearch === 'function';

  // Headless selection core
  const core = useMultiSelectCore<T>({
    options,
    selected,
    onChange,
    valueKey,
    labelKey,
    enableSelectAll: !!withSelectAll,
    selectAllValue,
  });

  // Local filtering state (used only when withLocalFilter=true)
  const [filtered, setFiltered] = useState<T[]>(options);
  useEffect(() => setFiltered(options), [options]);

  // Base list: local filter layered over current options when enabled
  const baseList = useMemo(
    () => (hasLocalFilter ? filtered : options),
    [hasLocalFilter, filtered, options]
  );

  // Inject “Select All” after local filtering (if enabled)
  const visibleOptions = useMemo(
    () =>
      withSelectAll
        ? getVisibleOptions<T>({
            options: baseList,
            labelKey,
            valueKey,
            withSelectAll,
            selectAllIdx,
            selectAllLabel,
            selectAllValue,
          })
        : baseList,
    [
      baseList,
      withSelectAll,
      selectAllIdx,
      selectAllLabel,
      selectAllValue,
      labelKey,
      valueKey,
    ]
  );

  // Row renderer composed from core behavior
  const renderRow = useRenderRow<T>({
    isLocalSearch: hasLocalFilter,
    isSelectAllOption: core.isSelectAllOption,
    allAreSelected: core.allAreSelected,
    isSelected: core.isSelected,
    getLabel: core.getLabel,
    toggle: core.toggle,
    renderOption,
  });

  // Merge caller-provided extraData with our selection/filter signatures
  const mergedExtraData = useMemo(() => {
    const theirs = Array.isArray(infiniteProps?.extraData)
      ? infiniteProps!.extraData
      : infiniteProps?.extraData != null
      ? [infiniteProps!.extraData]
      : [];
    // include selectedKey, visible length, and itemGap to ensure separators & rows re-render properly
    return [...theirs, core.selectedKey, visibleOptions.length, itemGap];
  }, [
    infiniteProps?.extraData,
    core.selectedKey,
    visibleOptions.length,
    itemGap,
  ]);

  return (
    <View style={[{ flex: 1, width: '100%' }, style]}>
      {!!title && (
        <TextBold size="lg" mb="xs">
          {title}
        </TextBold>
      )}

      {/* Local filtering (client-side) */}
      {hasLocalFilter && (
        <SearchListBar<T>
          initialQuery=""
          data={options}
          placeholder={searchPlaceholder}
          extractSearchText={(i) => String((i as any)[labelKey] ?? '')}
          onChange={(items) => setFiltered(items)}
        />
      )}

      {/* Server-side search (UI-only; parent fetches & updates options) */}
      {hasServerSearch && (
        <SearchBar
          value={''} // UI-only; not controlling from here
          onChange={onSearch!}
          placeholder={searchPlaceholder ?? 'Search'}
          debounceMs={searchDebounceMs ?? 500}
          style={{ marginBottom: Spacings.lg }}
        />
      )}

      <InfiniteList<T>
        data={visibleOptions}
        idKey={valueKey as any}
        renderItem={(item) => renderRow(item, -1)}
        itemGap={itemGap}
        extraData={mergedExtraData}
        {...infiniteProps}
      />
    </View>
  );
}
