import { useMemo } from 'react';
import { TSelectAllIdx } from '../MultiSelect';
import { SELECT_ALL_LABEL_DEFAULT, SELECT_ALL_VALUE } from '../constants';

type TProps<T> = {
  options: T[];
  valueKey: keyof T;
  labelKey: keyof T;

  withSelectAll?: boolean;
  selectAllIdx?: TSelectAllIdx;
  selectAllLabel?: string;
  selectAllValue?: string;
};

export function useWithSelectAllOption<T>({
  options,
  valueKey,
  labelKey,
  withSelectAll,
  selectAllIdx = 0,
  selectAllValue = SELECT_ALL_VALUE,
  selectAllLabel = SELECT_ALL_LABEL_DEFAULT,
}: TProps<T>) {
  return useMemo(() => {
    if (!options.length || !withSelectAll) {
      return options;
    }

    const getId = (item: T) => String(item[valueKey]);

    // working copy to avoid mutating original
    const arr = options.slice();

    // find existing Select-All row (if any)
    const existingIdx = arr.findIndex((item) => getId(item) === selectAllValue);

    // compute desired index
    const desiredIdxRaw =
      selectAllIdx === 'last' ? arr.length : Number(selectAllIdx ?? 0);

    const desiredIdx = Math.max(0, Math.min(desiredIdxRaw, arr.length));

    // already exists
    if (existingIdx !== -1) {
      // if correct idx then return
      if (existingIdx === desiredIdx) {
        return arr;
      }

      // move to correct position and return
      const [item] = arr.splice(existingIdx, 1);

      arr.splice(Math.min(desiredIdx, arr.length), 0, item);

      return arr;
    }

    // not present: create the Select-All option and insert it
    const selectAllOption = {
      [labelKey]: selectAllLabel,
      [valueKey]: selectAllValue,
    } as T;

    arr.splice(Math.min(desiredIdx, arr.length), 0, selectAllOption);

    return arr;
  }, [
    options,
    withSelectAll,
    selectAllIdx,
    selectAllLabel,
    selectAllValue,
    valueKey,
    labelKey,
  ]);
}
