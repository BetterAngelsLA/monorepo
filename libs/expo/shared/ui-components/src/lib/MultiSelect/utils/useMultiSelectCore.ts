import { useCallback, useMemo } from 'react';

type IdGetter<T> = (item: T) => string;
type LabelGetter<T> = (item: T) => string;

export type UseMultiSelectCoreOpts<T> = {
  options: T[];
  selected: T[];
  onChange: (next: T[]) => void;

  /** Identity */
  valueKey?: keyof T; // OR provide getId
  getId?: IdGetter<T>;

  /** Labels (optional, convenience) */
  labelKey?: keyof T;
  getLabel?: LabelGetter<T>;

  /** “Select All” behavior */
  enableSelectAll?: boolean; // usually: search.kind === 'local'
  selectAllValue?: string; // default: '___ALL___'
};

export function useMultiSelectCore<T>({
  options,
  selected,
  onChange,
  valueKey,
  getId: getIdProp,
  labelKey,
  getLabel: getLabelProp,
  enableSelectAll = false,
  selectAllValue = '___ALL___',
}: UseMultiSelectCoreOpts<T>) {
  // id/label getters
  const getId: IdGetter<T> = useMemo(() => {
    if (getIdProp) return getIdProp;
    if (valueKey) return (x) => String((x as any)[valueKey]);
    throw new Error('useMultiSelectCore: provide either valueKey or getId');
  }, [getIdProp, valueKey]);

  const getLabel: LabelGetter<T> = useMemo(() => {
    if (getLabelProp) return getLabelProp;
    if (labelKey) return (x) => String((x as any)[labelKey] ?? '');
    return () => ''; // labels optional
  }, [getLabelProp, labelKey]);

  // Force re-render of rows when selection changes (and when list grows)
  const selectedKey = useMemo(
    () => selected.map(getId).sort().join('|'),
    [selected, getId]
  );

  const isSelected = useCallback(
    (item: T) => {
      const id = getId(item);
      return selected.some((s) => getId(s) === id);
    },
    [selected, getId]
  );

  const allAreSelected = useCallback(
    () => options.length > 0 && selected.length === options.length,
    [options.length, selected.length]
  );

  const isSelectAllOption = useCallback(
    (item: T) =>
      enableSelectAll && String(getId(item)) === String(selectAllValue),
    [enableSelectAll, getId, selectAllValue]
  );

  const toggle = useCallback(
    (item: T) => {
      if (enableSelectAll && isSelectAllOption(item)) {
        onChange(allAreSelected() ? [] : options);
        return;
      }
      if (isSelected(item)) {
        const id = getId(item);
        onChange(selected.filter((s) => getId(s) !== id));
      } else {
        onChange([...selected, item]);
      }
    },
    [
      enableSelectAll,
      isSelectAllOption,
      allAreSelected,
      isSelected,
      onChange,
      selected,
      getId,
      options,
    ]
  );

  return {
    // getters
    getId,
    getLabel,

    // state-like
    selectedKey,

    // predicates
    isSelected,
    allAreSelected,
    isSelectAllOption,

    // actions
    toggle,
  };
}
