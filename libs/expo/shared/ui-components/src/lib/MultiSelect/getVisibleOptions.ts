import { TSelectAllIdx } from './MultiSelect';
import { SELECT_ALL_LABEL_DEFAULT, SELECT_ALL_VALUE } from './constants';

export type TGetVisibleOptions<T> = {
  options: T[];
  labelKey: keyof T;
  valueKey: keyof T;
  withSelectAll?: boolean;
  selectAllLabel?: string;
  selectAllValue?: string;
  selectAllIdx?: TSelectAllIdx;
  searchText?: string;
};

export function getVisibleOptions<T>(props: TGetVisibleOptions<T>): T[] {
  const {
    labelKey,
    valueKey,
    options,
    searchText = '',
    withSelectAll,
    selectAllIdx = 0,
    selectAllValue = SELECT_ALL_VALUE,
    selectAllLabel = SELECT_ALL_LABEL_DEFAULT,
  } = props;

  let visibleOptions = [...options];

  const filterQuery = searchText.trim().toLowerCase();

  if (filterQuery) {
    visibleOptions = options.filter((option) => {
      const optionLabel = (option[labelKey] as string).toLowerCase();

      return optionLabel.includes(filterQuery);
    });

    return visibleOptions;
  }

  if (withSelectAll) {
    const selectAllOption = {
      [labelKey]: selectAllLabel,
      [valueKey]: selectAllValue,
    } as T;

    if (selectAllIdx === 'last') {
      visibleOptions.push(selectAllOption);
    } else {
      const insertIdx = Number.isInteger(selectAllIdx) ? selectAllIdx : 0;

      visibleOptions.splice(insertIdx, 0, selectAllOption);
    }

    return visibleOptions;
  }

  return visibleOptions;
}
