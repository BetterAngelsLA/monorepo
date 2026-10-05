/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  demographicFilter,
  parkingFilter,
  petsFilter,
  roomStyleFilter,
  shelterTypeFilter,
  specialSituationFilter,
  UNKNOWN_FILTER_VALUE,
} from './config';
import { useFilterOptions } from './useFilterOptions';

describe('useFilterOptions', () => {
  const options = demographicFilter.options;

  it('shows 6 options when collapsed', () => {
    const { result } = renderHook(() => useFilterOptions(options, []));

    expect(result.current.visibleOptions).toHaveLength(6);
    expect(result.current.hasAdditionalOptions).toBe(true);
  });

  it('sorts regular options alphabetically', () => {
    const { result } = renderHook(() => useFilterOptions(options, []));

    const visibleLabels = result.current.visibleOptions.map(
      (option) => option.label,
    );

    const alphabetizedLabels = [...visibleLabels].sort((first, second) =>
      first.localeCompare(second, undefined, {
        sensitivity: 'base',
      }),
    );

    expect(visibleLabels).toEqual(alphabetizedLabels);
  });

  it('shows all options after Show More is enabled', () => {
    const { result } = renderHook(() => useFilterOptions(options, []));

    act(() => {
      result.current.setShowMoreOptions(true);
    });

    expect(result.current.visibleOptions).toHaveLength(options.length);
  });

  it('keeps Include Unknown pinned to the bottom', () => {
    const { result } = renderHook(() => useFilterOptions(options, []));

    act(() => {
      result.current.setShowMoreOptions(true);
    });

    const labels = result.current.visibleOptions.map((option) => option.label);

    expect(labels.at(-1)).toBe('Include Unknown');
  });

  it.each([
    { filter: demographicFilter, label: 'Others' },
    { filter: roomStyleFilter, label: 'Other' },
    { filter: shelterTypeFilter, label: 'Other' },
    { filter: parkingFilter, label: 'No Parking' },
    { filter: petsFilter, label: 'No Pets Allowed' },
    { filter: specialSituationFilter, label: 'None' },
  ])(
    'pins $label above Include Unknown for $filter.name',
    ({ filter, label }) => {
      const { result } = renderHook(() => useFilterOptions(filter.options, []));

      act(() => {
        result.current.setShowMoreOptions(true);
      });

      const labels = result.current.visibleOptions.map(
        (option) => option.label,
      );

      expect(labels.at(-2)).toBe(label);
      expect(labels.at(-1)).toBe('Include Unknown');
      const regularLabels = labels.slice(0, -2);
      expect(regularLabels).toEqual(
        [...regularLabels].sort((first, second) =>
          first.localeCompare(second, undefined, { sensitivity: 'base' }),
        ),
      );
      expect(result.current.visibleOptions).toHaveLength(filter.options.length);
    },
  );

  it('passes only selected visible values through visibleValues', () => {
    const { result: initialResult } = renderHook(() =>
      useFilterOptions(options, []),
    );

    const firstVisibleValue = initialResult.current.visibleOptions[0].value;

    const visibleValueSet = new Set(
      initialResult.current.visibleOptions.map((option) =>
        String(option.value),
      ),
    );

    const hiddenOption = options.find(
      (option) => !visibleValueSet.has(String(option.value)),
    );

    expect(hiddenOption).toBeDefined();
    if (!hiddenOption) {
      throw new Error('Expected a hidden demographic option');
    }

    const { result } = renderHook(() =>
      useFilterOptions(options, [firstVisibleValue, hiddenOption.value]),
    );

    expect(result.current.visibleValues).toContain(String(firstVisibleValue));

    expect(result.current.visibleValues).not.toContain(
      String(hiddenOption.value),
    );
  });

  it('preserves hidden selections when a visible selection changes', () => {
    const { result: initialResult } = renderHook(() =>
      useFilterOptions(options, []),
    );

    const firstVisibleOption = initialResult.current.visibleOptions[0];

    const { result } = renderHook(() =>
      useFilterOptions(options, [
        firstVisibleOption.value,
        UNKNOWN_FILTER_VALUE,
      ]),
    );

    const nextVisibleSelection = result.current.visibleOptions
      .slice(1, 2)
      .map((option) => String(option.value));

    const mergedSelection =
      result.current.getMergedSelection(nextVisibleSelection);

    expect(mergedSelection).toContain(UNKNOWN_FILTER_VALUE);

    expect(mergedSelection).toEqual(
      expect.arrayContaining(nextVisibleSelection),
    );
  });

  it('provides every category value for Select All', () => {
    const { result } = renderHook(() => useFilterOptions(options, []));

    expect(result.current.allOptionValues).toHaveLength(options.length);

    expect(result.current.allOptionValues).toEqual(
      expect.arrayContaining(options.map((option) => String(option.value))),
    );
  });
});
