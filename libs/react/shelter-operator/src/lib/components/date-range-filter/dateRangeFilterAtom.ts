import { atomWithReset } from 'jotai/utils';
import { DEFAULT_PRESET, resolvePreset } from './presets';
import type { DateRangeFilterState } from './types';

/**
 * Default filter state, captured at module load: the dashboard opens on
 * "Last 30 Days". Resetting the atom returns to this value.
 */
export const initialDateRangeFilter: DateRangeFilterState = {
  preset: DEFAULT_PRESET,
  range: resolvePreset(DEFAULT_PRESET),
};

/**
 * Shared date-range filter state. One source of truth for the presets dropdown
 * and the custom calendar — mirrors the `atomWithReset` pattern in
 * `atoms/shelterFiltersAtom.ts`.
 */
export const dateRangeFilterAtom =
  atomWithReset<DateRangeFilterState>(initialDateRangeFilter);
