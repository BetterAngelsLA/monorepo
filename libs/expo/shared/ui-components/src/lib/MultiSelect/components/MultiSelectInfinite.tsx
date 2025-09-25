import { Spacings } from '@monorepo/expo/shared/static';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { InfiniteList } from '../../InfiniteList';
import { SearchBar } from '../../SearchBar';
import { SearchListBar } from '../../SearchListBar';
import TextBold from '../../TextBold';
import { DEFAULT_MARGIN_BOTTOM } from '../constants';
import { MultiSelectInfiniteProps } from '../types';
import { useMultiSelect } from '../utils/useMultiSelect';
import { useRenderRow } from '../utils/useRenderRow';
import { useWithSelectAllOption } from '../utils/useWithSelectAllOption';

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

    // search (mutually exclusive via types)
    withLocalFilter,
    searchPlaceholder,
    onSearch,
    searchDebounceMs,

    // pass-through for InfiniteList/FlashList
    infiniteProps,
    keyExtractor,
  } = props;

  const hasLocalFilter = withLocalFilter === true;
  const hasServerSearch = typeof onSearch === 'function';

  // Local filtering state (used only when withLocalFilter=true)
  const [filtered, setFiltered] = useState<T[]>(options);
  useEffect(() => setFiltered(options), [options]);

  // Base list: local filter layered over current options when enabled
  const baseOptions = useMemo(
    () => (withLocalFilter ? filtered : options),
    [withLocalFilter, filtered, options]
  );

  const visibleOptions = useWithSelectAllOption<T>({
    options: baseOptions,
    valueKey,
    labelKey,
    withSelectAll,
    selectAllIdx,
    selectAllLabel,
    selectAllValue,
  });

  const {
    isSelectAllOption,
    allAreSelected,
    isSelected,
    getLabel,
    toggleSelected,
    signature,
  } = useMultiSelect<T>({
    options: visibleOptions,
    selected,
    onChange,
    valueKey,
    labelKey,
    withSelectAll,
    selectAllValue,
  });

  const renderRow = useRenderRow<T>({
    isLocalSearch: hasLocalFilter,
    isSelectAllOption,
    allAreSelected,
    isSelected,
    getLabel,
    toggleSelected,
    renderOption,
  });

  const keyExtractorStable = useCallback(
    (item: T, idx: number) => {
      if (keyExtractor) {
        return keyExtractor(item, idx);
      }

      // default
      return String(item[valueKey!]);
    },
    [keyExtractor, valueKey]
  );

  return (
    <View style={[{ flex: 1, width: '100%' }, style]}>
      {!!title && (
        <TextBold size="lg" mb="xs">
          {title}
        </TextBold>
      )}

      {hasLocalFilter && (
        <SearchListBar<T>
          initialQuery=""
          data={options}
          placeholder={searchPlaceholder}
          extractSearchText={(i) => String(i[labelKey] ?? '')}
          onChange={(items) => setFiltered(items)}
          style={{ marginBottom: DEFAULT_MARGIN_BOTTOM }}
        />
      )}

      {hasServerSearch && (
        <SearchBar
          value={''} // UI-only; not controlling from here
          onChange={onSearch!}
          placeholder={searchPlaceholder}
          debounceMs={searchDebounceMs}
          style={{ marginBottom: DEFAULT_MARGIN_BOTTOM }}
        />
      )}

      <InfiniteList<T>
        data={visibleOptions}
        keyExtractor={keyExtractorStable}
        renderItem={(item) => renderRow(item, -1)} // infinite list takes Item only
        itemGap={itemGap}
        extraData={signature}
        {...infiniteProps}
      />
    </View>
  );
}
