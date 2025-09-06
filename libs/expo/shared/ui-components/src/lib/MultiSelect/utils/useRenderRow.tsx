import { useCallback } from 'react';
import { MultiSelectItem, type TMultiSelectItem } from '../MultiSelectItem';

type BuildRenderRowArgs<T> = {
  isLocalSearch: boolean;
  isSelectAllOption: (x: T) => boolean;
  allAreSelected: () => boolean;
  isSelected: (x: T) => boolean;
  getLabel: (x: T) => string;
  toggle: (x: T) => void;
  renderOption?: (
    x: T,
    props: TMultiSelectItem,
    index: number
  ) => React.ReactElement;
};

export function useRenderRow<T>(args: BuildRenderRowArgs<T>) {
  const {
    isLocalSearch,
    isSelectAllOption,
    allAreSelected,
    isSelected,
    getLabel,
    toggle,
    renderOption,
  } = args;

  return useCallback(
    (item: T, index: number) => {
      const isAll = isLocalSearch && isSelectAllOption(item);
      const checked = isAll ? allAreSelected() : isSelected(item);
      const label = getLabel(item);

      const optionProps: TMultiSelectItem = {
        isChecked: checked,
        onClick: () => toggle(item),
        label,
        accessibilityHint: checked
          ? `uncheck option: ${label}`
          : `check option: ${label}`,
        testId: `MultiSelect-option-${
          index >= 0 ? index : label.replace(/\s+/g, '-')
        }`,
      };

      return renderOption ? (
        renderOption(item, optionProps, index)
      ) : (
        <MultiSelectItem {...optionProps} />
      );
    },
    [
      isLocalSearch,
      isSelectAllOption,
      allAreSelected,
      isSelected,
      getLabel,
      toggle,
      renderOption,
    ]
  );
}
