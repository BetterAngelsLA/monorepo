import { SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Key, ReactNode, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import BasicInput from '../BasicInput';
import TextBold from '../TextBold';
import {
  MultiSelectItem,
  TMultiSelectItem,
} from './components/MultiSelectItem';
import { NoResultsFound } from './components/NoResultsFound';
import { SELECT_ALL_LABEL_DEFAULT, SELECT_ALL_VALUE } from './constants';
import { getVisibleOptions } from './utils/getVisibleOptions';

export type TSelectAllIdx = number | 'last';

export interface TMultiSelect<T> {
  style?: StyleProp<ViewStyle>;
  options: T[];
  selected: T[];
  valueKey: keyof T;
  labelKey: keyof T;
  onChange: (newSelected: T[]) => void;
  title?: string;
  withSelectAll?: boolean;
  selectAllIdx?: TSelectAllIdx;
  selectAllLabel?: string;
  withFilter?: boolean;
  filterPlaceholder?: string;
  onSearch?: (search: string) => void;
  search?: string;
  renderOption?: (
    option: T,
    props: TMultiSelectItem,
    index: number
  ) => ReactNode;
}

export function MultiSelect<T>(props: TMultiSelect<T>) {
  const {
    style,
    options,
    selected = [],
    valueKey,
    labelKey,
    onChange,
    onSearch,
    search,
    title,
    withSelectAll,
    selectAllIdx = 0,
    selectAllLabel = SELECT_ALL_LABEL_DEFAULT,
    withFilter,
    filterPlaceholder = 'Search',
    renderOption,
  } = props;

  const [searchText, setSearchText] = useState('');

  const toggleChecked = (item: T) => {
    // toggle Select All
    if (isSelectAllOption(item)) {
      if (allAreSelected()) {
        return onChange([]);
      }

      return onChange(options);
    }

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

  function allAreSelected(): boolean {
    return selected.length === options.length;
  }

  function isSelectAllOption(option: T): boolean {
    return option[valueKey] === SELECT_ALL_VALUE;
  }

  function isSelected(option: T): boolean {
    if (isSelectAllOption(option)) {
      return allAreSelected();
    }

    return !!selected.find((item) => {
      return item[valueKey] === option[valueKey];
    });
  }

  const visibleOptions = getVisibleOptions({
    options,
    labelKey,
    valueKey,
    searchText,
    withSelectAll,
    selectAllIdx,
    selectAllLabel,
    selectAllValue: SELECT_ALL_VALUE,
  });

  return (
    <View style={[style, { width: '100%' }]}>
      {!!title && (
        <TextBold size="lg" mb="xs">
          {title}
        </TextBold>
      )}

      {!!onSearch && !!withFilter && (
        <BasicInput
          value={search}
          onDelete={() => onSearch('')}
          autoCorrect={false}
          onChangeText={(query) => onSearch(query)}
          placeholder={filterPlaceholder}
          icon={<SearchIcon color={Colors.NEUTRAL} />}
          mb="md"
        />
      )}

      {!!withFilter && !onSearch && (
        <BasicInput
          value={searchText}
          onDelete={() => setSearchText('')}
          onChangeText={(query) => setSearchText(query)}
          placeholder={filterPlaceholder}
          icon={<SearchIcon color={Colors.NEUTRAL} />}
          mb="md"
        />
      )}

      <View style={{ gap: Spacings.xs }}>
        {!visibleOptions.length && <NoResultsFound />}

        {!!visibleOptions.length &&
          visibleOptions.map((option, index) => {
            const optionValue = option[valueKey];
            const isChecked = isSelected(option);
            const label = option[labelKey] as string;
            const onClick = () => toggleChecked(option);
            const accessibilityHint = isChecked
              ? `uncheck option: ${label}`
              : `check option: ${label}`;
            const testId = `MultiSelect-option-${index}`;

            const optionProps = {
              isChecked,
              onClick,
              label,
              accessibilityHint,
              testId,
            };

            if (renderOption) {
              return renderOption(option, optionProps, index);
            }

            return (
              <MultiSelectItem key={optionValue as Key} {...optionProps} />
            );
          })}
      </View>
    </View>
  );
}
