import { useMemo } from 'react';
import {
  ACCESSIBILITY_OPTIONS,
  DEMOGRAPHICS_OPTIONS,
  FUNDERS_OPTIONS,
  PETS_OPTIONS,
} from '../components/ShelterProfile/constants';
import { useShelterProperties } from './useShelterProperties';

export interface FilteredPropertyOptions {
  accessibility: { label: string; value: string }[];
  demographics: { label: string; value: string }[];
  funders: { label: string; value: string }[];
  pets: { label: string; value: string }[];
}

function filterPropertyOptions<T extends string>(
  shelterProperties: { name?: T | null }[] | undefined,
  allProperties: { label: string; value: T }[]
): { label: string; value: T }[] {
  const shelterValues = new Set(
    (shelterProperties ?? []).map((i) => i.name).filter(Boolean)
  );
  return allProperties.filter((opt) => shelterValues.has(opt.value));
}

export function useFilteredPropertyOptions(
  shelterId: string
): FilteredPropertyOptions & { loading: boolean } {
  const { shelterProperties, loading } = useShelterProperties(shelterId);

  const result = useMemo<FilteredPropertyOptions>(() => {
    if (loading || !shelterProperties) {
      return {
        accessibility: ACCESSIBILITY_OPTIONS,
        demographics: DEMOGRAPHICS_OPTIONS,
        funders: FUNDERS_OPTIONS,
        pets: PETS_OPTIONS,
      };
    }

    return {
      accessibility: filterPropertyOptions(
        shelterProperties.accessibility,
        ACCESSIBILITY_OPTIONS
      ),
      demographics: filterPropertyOptions(
        shelterProperties.demographics,
        DEMOGRAPHICS_OPTIONS
      ),
      funders: filterPropertyOptions(
        shelterProperties.funders,
        FUNDERS_OPTIONS
      ),
      pets: filterPropertyOptions(shelterProperties.pets, PETS_OPTIONS),
    };
  }, [shelterProperties, loading]);

  return { ...result, loading };
}
