import { SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { Key, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import BasicInput from '../BasicInput';
import Checkbox from '../Checkbox';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';
import { NoResultsFound } from './NoResultsFound';
import { SELECT_ALL_LABEL_DEFAULT, SELECT_ALL_VALUE } from './constants';
import { getVisibleOptions } from './getVisibleOptions';

export type TSelectAllIdx = number | 'last';

interface IProps<T> {
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
}

export function MultiSelect<T>(props: IProps<T>) {
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

      <View>
        {!visibleOptions.length && <NoResultsFound />}

        {!!visibleOptions.length &&
          visibleOptions.map((option, index) => {
            const isChecked = isSelected(option);

            return (
              <Checkbox
                key={option[valueKey] as Key}
                mt={index !== 0 ? 'xs' : undefined}
                isChecked={isChecked}
                onCheck={() => toggleChecked(option)}
                size="sm"
                hasBorder
                label={
                  <TextRegular>{(option as T)[labelKey] as string}</TextRegular>
                }
                accessibilityHint={
                  isChecked
                    ? `uncheck option: ${option[labelKey]}`
                    : `check option: ${option[labelKey]}`
                }
                testId={`MultiSelect-${index}`}
              />
            );
          })}
      </View>
    </View>
  );
}
