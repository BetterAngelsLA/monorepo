import { useCallback } from 'react';
import {
  MultiSelectItem,
  TMultiSelectItem,
} from '../components/MultiSelectItem';

type TProps<T> = {
  isLocalSearch: boolean;
  isSelectAllOption: (item: T) => boolean;
  allAreSelected: () => boolean;
  isSelected: (item: T) => boolean;
  getLabel: (item: T) => string;
  toggleSelected: (item: T) => void;
  renderOption?: (
    item: T,
    props: TMultiSelectItem,
    index: number
  ) => React.ReactElement;
};

export function useRenderRow<T>(args: TProps<T>) {
  const {
    isLocalSearch,
    isSelectAllOption,
    allAreSelected,
    isSelected,
    getLabel,
    toggleSelected,
    renderOption,
  } = args;

  return useCallback(
    (item: T, index: number) => {
      const isAll = isLocalSearch && isSelectAllOption(item);
      const checked = isAll ? allAreSelected() : isSelected(item);
      const label = getLabel(item);

      const optionProps: TMultiSelectItem = {
        isChecked: checked,
        onClick: () => toggleSelected(item),
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
      toggleSelected,
      renderOption,
    ]
  );
}
