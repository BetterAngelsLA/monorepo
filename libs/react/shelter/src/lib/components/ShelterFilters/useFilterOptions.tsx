import { useMemo, useState } from 'react';
import {
  TFilterOptionType,
  TShelterFilterOption,
  UNKNOWN_FILTER_VALUE,
} from './config';

const VISIBLE_OPTION_COUNT = 6;

export function useFilterOptions(
  options: TShelterFilterOption[],
  values: TFilterOptionType[] | null | undefined,
  visibleOptionCount = VISIBLE_OPTION_COUNT,
) {
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const normalizedValues = useMemo(() => (values ?? []).map(String), [values]);

  const sortedOptions = useMemo(() => {
    const regularOptions = options.filter(
      (option) =>
        option.label !== 'Other' && option.value !== UNKNOWN_FILTER_VALUE,
    );

    const otherOptions = options.filter((option) => option.label === 'Other');

    const unknownOptions = options.filter(
      (option) => option.value === UNKNOWN_FILTER_VALUE,
    );

    regularOptions.sort((first, second) =>
      first.label.localeCompare(second.label, undefined, {
        sensitivity: 'base',
      }),
    );

    return [...regularOptions, ...otherOptions, ...unknownOptions];
  }, [options]);

  const hasAdditionalOptions = sortedOptions.length > visibleOptionCount;

  const visibleOptions = useMemo(
    () =>
      showMoreOptions
        ? sortedOptions
        : sortedOptions.slice(0, visibleOptionCount),
    [showMoreOptions, sortedOptions, visibleOptionCount],
  );

  const visibleValueSet = useMemo(
    () => new Set(visibleOptions.map((option) => String(option.value))),
    [visibleOptions],
  );

  const visibleValues = useMemo(
    () => normalizedValues.filter((value) => visibleValueSet.has(value)),
    [normalizedValues, visibleValueSet],
  );

  const allOptionValues = useMemo(
    () => sortedOptions.map((option) => String(option.value)),
    [sortedOptions],
  );

  function getMergedSelection(selectedVisible: string[]): string[] {
    const hiddenSelectedValues = normalizedValues.filter(
      (value) => !visibleValueSet.has(value),
    );

    return [...hiddenSelectedValues, ...selectedVisible];
  }

  return {
    showMoreOptions,
    setShowMoreOptions,
    visibleOptions,
    visibleValues,
    allOptionValues,
    hasAdditionalOptions,
    getMergedSelection,
  };
}
