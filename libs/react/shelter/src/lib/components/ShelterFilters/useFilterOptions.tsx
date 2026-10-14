import { useMemo, useState } from 'react';
import {
  DemographicChoices,
  ParkingChoices,
  PetChoices,
  RoomStyleChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
} from '../../apollo';
import {
  TFilterOptionType,
  TShelterFilterOption,
  UNKNOWN_FILTER_VALUE,
} from './config';

const VISIBLE_OPTION_COUNT = 6;

// Match stable values, since labels vary (for example, Other and Others).
const BOTTOM_OPTION_VALUES = new Set<TFilterOptionType>([
  DemographicChoices.Other,
  RoomStyleChoices.Other,
  ShelterChoices.Other,
  ParkingChoices.NoParking,
  PetChoices.NoPetsAllowed,
  SpecialSituationRestrictionChoices.None,
]);

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
        !BOTTOM_OPTION_VALUES.has(option.value) &&
        option.value !== UNKNOWN_FILTER_VALUE,
    );

    const bottomOptions = options.filter((option) =>
      BOTTOM_OPTION_VALUES.has(option.value),
    );

    const unknownOptions = options.filter(
      (option) => option.value === UNKNOWN_FILTER_VALUE,
    );

    regularOptions.sort((first, second) =>
      first.label.localeCompare(second.label, undefined, {
        sensitivity: 'base',
      }),
    );

    return [...regularOptions, ...bottomOptions, ...unknownOptions];
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
