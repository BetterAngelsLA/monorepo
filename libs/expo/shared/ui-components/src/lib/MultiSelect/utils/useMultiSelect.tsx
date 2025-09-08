import { useCallback, useMemo } from 'react';
import { SELECT_ALL_VALUE } from '../constants';

export type TUseMultiSelect<T> = {
  options: T[];
  selected: T[];
  onChange: (next: T[]) => void;
  valueKey: Extract<keyof T, string | number>;
  labelKey: Extract<keyof T, string | number>;
  withSelectAll?: boolean;
  selectAllValue?: string;
};

export function useMultiSelect<T>({
  options,
  selected,
  onChange,
  valueKey,
  labelKey,
  withSelectAll,
  selectAllValue = SELECT_ALL_VALUE,
}: TUseMultiSelect<T>) {
  const selectAllEnabled = !!withSelectAll;

  const getId = useCallback((item: T) => String(item[valueKey]), [valueKey]);
  const getLabel = useCallback((item: T) => String(item[labelKey]), [labelKey]);

  const isSelectAllOption = useCallback(
    (item: T) => selectAllEnabled && getId(item) === selectAllValue,
    [selectAllEnabled, getId, selectAllValue]
  );

  const selectables = useMemo(
    () => options.filter((o) => !isSelectAllOption(o)),
    [options, isSelectAllOption]
  );

  const selectedIdSet = useMemo(
    () => new Set(selected.map(getId)),
    [selected, getId]
  );

  const selectableIdSet = useMemo(
    () => new Set(selectables.map(getId)),
    [selectables, getId]
  );

  // stable signature to identify value changes
  const signature = useMemo(
    () => [...selectedIdSet].sort().join('|'),
    [selectedIdSet]
  );

  const isSelected = useCallback(
    (item: T) => selectedIdSet.has(getId(item)),
    [selectedIdSet, getId]
  );

  const allAreSelected = useCallback(() => {
    if (selectables.length === 0) return false;
    for (const item of selectables) {
      if (!selectedIdSet.has(getId(item))) return false;
    }
    return true;
  }, [selectables, selectedIdSet, getId]);

  const toggleSelected = useCallback(
    (item: T) => {
      const itemId = getId(item);

      if (selectAllEnabled && itemId === selectAllValue) {
        if (allAreSelected()) {
          return onChange(
            selected.filter((s) => !selectableIdSet.has(getId(s)))
          );
        }

        const next = [...selected];

        for (const s of selectables) {
          const id = getId(s);
          if (!selectedIdSet.has(id)) next.push(s);
        }

        return onChange(next);
      }

      // regular item toggle
      if (selectedIdSet.has(itemId)) {
        return onChange(selected.filter((s) => getId(s) !== itemId));
      }

      return onChange([...selected, item]);
    },
    [
      selectAllEnabled,
      selectAllValue,
      allAreSelected,
      selected,
      onChange,
      getId,
      selectedIdSet,
      selectables,
      selectableIdSet,
    ]
  );

  return {
    // getters
    getId,
    getLabel,

    // unique signature for selection (useful for list extraData)
    signature,

    // predicates
    isSelected,
    allAreSelected,
    isSelectAllOption,

    // actions
    toggleSelected,
  };
}
