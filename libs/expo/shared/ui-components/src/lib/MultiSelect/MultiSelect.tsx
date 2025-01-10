import { SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { Key, useState } from 'react';
import { View } from 'react-native';
import BasicInput from '../BasicInput';
import Checkbox from '../Checkbox';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';
import NoResultsFound from './NoResultsFound';
import { getVisibleOptions } from './getVisibleOptions';

const SELECT_ALL_KEY = 'select_all';
const SELECT_ALL_LABEL = 'Select All';

export type TSelectAllIdx = number | 'last';

interface IProps<T> {
  title: string;
  options: T[];
  selected: T[];
  setSelectedItems: React.Dispatch<React.SetStateAction<T[]>>;
  valueKey: keyof T;
  labelKey: keyof T;
  selectAllIdx?: TSelectAllIdx;
  selectAllLabel?: string;
  useFilter?: boolean;
  filterPlaceholder?: string;
}

export function MultiSelect<T>(props: IProps<T>) {
  const {
    title,
    options,
    valueKey,
    labelKey,
    setSelectedItems,
    selected = [],
    selectAllIdx,
    selectAllLabel = SELECT_ALL_LABEL,
    useFilter,
    filterPlaceholder = 'Search',
  } = props;

  const [searchText, setSearchText] = useState('');

  const toggleChecked = (item: T) => {
    setSelectedItems((prev) => {
      // toggle Select All
      if (isSelectAllOption(item)) {
        if (allAreSelected(prev)) {
          return [];
        }

        return options;
      }

      // uncheck
      if (isSelected(item, prev)) {
        const newSelectedItems = prev.filter((prevItem) => {
          return item[valueKey] !== prevItem[valueKey];
        });

        return newSelectedItems;
      }

      // check
      return [...prev, item];
    });
  };

  function allAreSelected(selectedOptions: T[]): boolean {
    return selectedOptions.length === options.length;
  }

  function isSelectAllOption(option: T): boolean {
    return option[valueKey] === SELECT_ALL_KEY;
  }

  function isSelected(option: T, selectedOptions: T[]): boolean {
    if (isSelectAllOption(option)) {
      return allAreSelected(selectedOptions);
    }

    return !!selectedOptions.find((item) => {
      return item[valueKey] === option[valueKey];
    });
  }

  const visibleOptions = getVisibleOptions({
    options,
    labelKey,
    valueKey,
    selectAllLabel,
    searchText,
    selectAllIdx,
    selectAllKey: SELECT_ALL_KEY,
  });

  return (
    <View style={{ width: '100%' }}>
      {!!title && (
        <TextBold size="lg" mb="xs">
          {title}
        </TextBold>
      )}

      {!!useFilter && (
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
            const isChecked = isSelected(option, selected);

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
              />
            );
          })}
      </View>
    </View>
  );
}
