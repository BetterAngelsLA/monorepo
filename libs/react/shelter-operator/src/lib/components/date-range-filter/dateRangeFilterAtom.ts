import { atomWithReset } from 'jotai/utils';
import { DEFAULT_PRESET, resolvePreset } from './presets';
import type { DateRangeFilterState } from './types';

export const initialDateRangeFilter: DateRangeFilterState = {
  preset: DEFAULT_PRESET,
  range: resolvePreset(DEFAULT_PRESET),
};

export const dateRangeFilterAtom =
  atomWithReset<DateRangeFilterState>(initialDateRangeFilter);
