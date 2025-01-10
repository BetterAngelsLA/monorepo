import { TSelectAllIdx } from './MultiSelect';

type TGetVisibleOptions<T> = {
  options: T[];
  labelKey: keyof T;
  valueKey: keyof T;
  selectAllKey: string;
  selectAllLabel: string;
  searchText?: string;
  selectAllIdx?: TSelectAllIdx;
};

export function getVisibleOptions<T>(props: TGetVisibleOptions<T>): T[] {
  const {
    labelKey,
    valueKey,
    options,
    searchText = '',
    selectAllKey,
    selectAllIdx,
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

  // add Select All option
  if (Number.isInteger(selectAllIdx) || selectAllIdx === 'last') {
    const selectAllOption = {
      [labelKey]: selectAllLabel,
      [valueKey]: selectAllKey,
    } as T;

    if (selectAllIdx === 'last') {
      visibleOptions.push(selectAllOption);
    } else {
      visibleOptions.splice(selectAllIdx as number, 0, selectAllOption);
    }

    return visibleOptions;
  }

  return visibleOptions;
}
