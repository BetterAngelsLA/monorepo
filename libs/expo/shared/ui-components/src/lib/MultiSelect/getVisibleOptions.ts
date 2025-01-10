import { TSelectAllIdx } from './MultiSelect';

type TGetVisibleOptions<T> = {
  options: T[];
  labelKey: keyof T;
  valueKey: keyof T;
  withSelectAll?: boolean;
  selectAllKey: string;
  selectAllLabel: string;
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
    selectAllKey,
    selectAllIdx = 0,
    selectAllLabel,
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
      [valueKey]: selectAllKey,
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
