import { Spacings } from '@monorepo/expo/shared/static';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SearchListBar } from '../../SearchBar';
import TextBold from '../../TextBold';
import { getVisibleOptions } from '../getVisibleOptions';
import type { MultiSelectStaticProps } from '../types';
import { useMultiSelectCore } from '../utils/useMultiSelectCore';
import { useRenderRow } from '../utils/useRenderRow';

export function MultiSelectStatic<T>(props: MultiSelectStaticProps<T>) {
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

    // select-all (applies when using local filtering)
    withSelectAll,
    selectAllIdx,
    selectAllLabel,
    selectAllValue,

    // row / empty
    renderOption,
    ListEmptyComponent,

    // search/filter
    withLocalFilter,
    searchPlaceholder,
  } = props;

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
    () => (withLocalFilter ? filtered : options),
    [withLocalFilter, filtered, options]
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

  const renderRow = useRenderRow<T>({
    isLocalSearch: !!withLocalFilter,
    isSelectAllOption: core.isSelectAllOption,
    allAreSelected: core.allAreSelected,
    isSelected: core.isSelected,
    getLabel: core.getLabel,
    toggle: core.toggle,
    renderOption,
  });

  return (
    <View style={[{ flex: 1, width: '100%' }, style]}>
      {!!title && (
        <TextBold size="lg" mb="xs">
          {title}
        </TextBold>
      )}

      {!!withLocalFilter && (
        <SearchListBar<T>
          initialQuery=""
          data={options}
          placeholder={searchPlaceholder}
          extractSearchText={(i) => String(i[labelKey] ?? '')}
          onChange={(items) => setFiltered(items)}
        />
      )}

      <View style={{ gap: itemGap }}>
        {visibleOptions.length === 0
          ? ListEmptyComponent ?? null
          : visibleOptions.map((it, i) => (
              <Fragment key={String((it as any)[valueKey] ?? i)}>
                {renderRow(it, i)}
              </Fragment>
            ))}
      </View>
    </View>
  );
}
