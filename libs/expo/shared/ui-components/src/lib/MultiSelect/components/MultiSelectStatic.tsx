import { Spacings } from '@monorepo/expo/shared/static';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SearchListBar } from '../../SearchListBar';
import TextBold from '../../TextBold';
import { DEFAULT_MARGIN_BOTTOM } from '../constants';
import type { MultiSelectStaticProps } from '../types';
import { useMultiSelect } from '../utils/useMultiSelect';
import { useRenderRow } from '../utils/useRenderRow';
import { useWithSelectAllOption } from '../utils/useWithSelectAllOption';
import { NoResultsFound } from './NoResultsFound';

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
    selectAllIdx = 0,
    selectAllLabel,
    selectAllValue,

    // row renderer
    renderOption,

    // search/filter
    withLocalFilter,
    searchPlaceholder,
  } = props;

  // Local filtering state (used only when withLocalFilter=true)
  const [filtered, setFiltered] = useState<T[]>(options);

  // reset initial options on change
  useEffect(() => setFiltered(options), [options]);

  // Base list: local filtered or options
  const baseList = useMemo(
    () => (withLocalFilter ? filtered : options),
    [withLocalFilter, filtered, options]
  );

  const visibleOptions = useWithSelectAllOption<T>({
    options: baseList,
    valueKey,
    labelKey,
    withSelectAll,
    selectAllIdx,
    selectAllLabel,
    selectAllValue,
  });

  // Handle selections from visible options
  const {
    isSelectAllOption,
    allAreSelected,
    isSelected,
    getLabel,
    toggleSelected,
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
    isLocalSearch: !!withLocalFilter,
    isSelectAllOption,
    allAreSelected,
    isSelected,
    getLabel,
    toggleSelected,
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
          style={{ marginBottom: DEFAULT_MARGIN_BOTTOM }}
        />
      )}

      {!visibleOptions.length && <NoResultsFound />}

      {!!visibleOptions.length && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            gap: itemGap,
            paddingBottom: 20,
          }}
        >
          {visibleOptions.map((it, i) => (
            <Fragment key={`${[valueKey]}}-${i})`}>{renderRow(it, i)}</Fragment>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
