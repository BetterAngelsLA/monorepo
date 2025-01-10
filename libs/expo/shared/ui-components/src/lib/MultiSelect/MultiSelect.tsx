import { Key } from 'react';
import { View } from 'react-native';
import Checkbox from '../Checkbox';
import TextRegular from '../TextRegular';

const SELECT_ALL_KEY = 'select_all';
const SELECT_ALL_LABEL = 'Select All';

const items = [
  { id: '1', value: 'Me' },
  { id: '2', value: 'All Authors' },
  { id: '3', value: 'Steve Young' },
  { id: '4', value: 'Alex Smith' },
  { id: '5', value: 'Joe Montana' },
  { id: '6', value: 'Jimmy Garrapolo' },
  { id: '7', value: 'Brock Purdy' },
];

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IProps<T> {
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  label: string;
  placeholder?: string;

  defaultValue?: string;
  labelMarginLeft?: TSpacing;
  boldLabel?: boolean;

  options: T[];
  selected: T[];
  setSelectedItems: React.Dispatch<React.SetStateAction<T[]>>;
  valueKey: keyof T;
  labelKey: keyof T;
  selectAllIdx?: number | 'last';
  selectAllLabel?: string;
}

export function MultiSelect<T>(props: IProps<T>) {
  const {
    label,
    options,
    valueKey,
    labelKey,
    setSelectedItems,
    selected = [],
    selectAllIdx,
    selectAllLabel = SELECT_ALL_LABEL,
  } = props;

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

  const visibleOptions = [...options];

  if (Number.isInteger(selectAllIdx) || selectAllIdx === 'last') {
    const selectAllOption = {
      [labelKey]: selectAllLabel,
      [valueKey]: SELECT_ALL_KEY,
    } as T;

    if (selectAllIdx === 'last') {
      visibleOptions.push(selectAllOption);
    } else {
      visibleOptions.splice(selectAllIdx as number, 0, selectAllOption);
    }
  }

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

  return (
    <View>
      {visibleOptions.map((option, index) => {
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
  );
}
