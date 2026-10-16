import { UnassignedReason } from '@monorepo/ba-platform/types';
import { describe, expect, it } from 'vitest';
import type { RegionCountType } from './hooks';
import {
  compareRegionCodes,
  kindLabel,
  kindLabelPlural,
  matches,
  regionBreakdownView,
  unassignedLabel,
  unassignedRowLabel,
} from './regionBreakdown';

const region = (
  overrides: Partial<RegionCountType> & { code: string },
): RegionCountType => ({
  __typename: 'RegionCountType',
  kind: 'council_district',
  name: `Region ${overrides.code}`,
  count: 10,
  isUnassigned: false,
  unassignedReason: null,
  ...overrides,
});

const unassigned = (
  overrides: Partial<RegionCountType> = {},
): RegionCountType =>
  region({
    code: '',
    name: '',
    isUnassigned: true,
    unassignedReason: UnassignedReason.OutsideAllRegions,
    ...overrides,
  });

describe('the dimension vocabulary', () => {
  it('resolves the wire value and the enum spelling', () => {
    // The wire `kind` is lowercase and `RegionDimension` is uppercase; both reach here.
    expect(kindLabel('council_district')).toBe('City Council District');
    expect(kindLabel('COUNCIL_DISTRICT')).toBe('City Council District');
    expect(kindLabel('coc')).toBe('Continuum of Care');
  });

  it('falls back to the raw value for a dimension this build does not know', () => {
    // A new dimension must render rather than come out blank or throw.
    expect(kindLabel('health_district')).toBe('health_district');
  });

  it('pluralises for the "All …" control, which is not a suffix in English', () => {
    expect(kindLabelPlural('city')).toBe('Cities');
    expect(kindLabelPlural('coc')).toBe('Continuums of Care');
    expect(kindLabelPlural('unknown_kind')).toBe('unknown_kinds');
  });
});

describe('the code ordering', () => {
  it('orders numeric codes as numbers, not as strings', () => {
    // The bug this exists for: database order reads "1", "10", "11", "2".
    const codes = ['10', '2', '1'];
    expect([...codes].sort(compareRegionCodes)).toEqual(['1', '2', '10']);
  });

  it('orders everything else alphabetically', () => {
    expect([...['90012', 'B', 'a']].sort(compareRegionCodes)).toEqual([
      '90012',
      'a',
      'B',
    ]);
  });
});

describe('the region name match', () => {
  it('matches a code as well as a name, case-insensitively', () => {
    expect(matches('Adrin Nazarian 13', 'nazarian')).toBe(true);
    expect(matches('Adrin Nazarian 13', '13')).toBe(true);
    expect(matches('Adrin Nazarian 13', '  NAZARIAN ')).toBe(true);
    expect(matches('Adrin Nazarian 13', '14')).toBe(false);
  });
});

describe('the unassigned labels', () => {
  it('separates a missing address from a coverage gap', () => {
    expect(
      unassignedLabel(
        unassigned({ unassignedReason: UnassignedReason.NoLocation }),
      ),
    ).toBe('No location on file');
    expect(
      unassignedLabel(
        unassigned({ unassignedReason: UnassignedReason.OutsideAllRegions }),
      ),
    ).toBe('Outside all boundaries');
  });

  it('names the kind only when the rollup spans every dimension', () => {
    const row = unassigned({ kind: 'council_district' });
    // Ungrouped, one label repeats per dimension, so the kind is what tells the rows apart.
    expect(unassignedRowLabel(row, undefined)).toBe(
      'Outside all boundaries (City Council District)',
    );
    // Grouped, every row shares the dimension; naming it again is noise.
    expect(unassignedRowLabel(row, 'council_district')).toBe(
      'Outside all boundaries',
    );
  });
});

describe('the reader selection applied to the rollup', () => {
  const rows: RegionCountType[] = [
    region({ code: '1', name: 'District 1', count: 30 }),
    region({ code: '2', name: '', count: 5 }),
    region({ code: '3', name: 'District 3', count: 0 }),
    unassigned({ count: 291 }),
  ];

  it('keeps the named regions with interactions, and the unassigned separately', () => {
    const view = regionBreakdownView(rows, []);

    expect(view.assigned.map((row) => row.code)).toEqual(['1', '2']);
    expect(view.unassigned).toHaveLength(1);
    expect(view.hasData).toBe(true);
    // The picker offers what can be filtered by; a region with no interactions is not it.
    expect(view.pickable.map((row) => row.code)).toEqual(['1', '2']);
    expect(view.filteredToName).toBeUndefined();
  });

  it('sorts the picker by code for reading', () => {
    const numeric = [
      region({ code: '10' }),
      region({ code: '2' }),
      region({ code: '1' }),
    ];

    expect(
      regionBreakdownView(numeric, []).selectable.map((row) => row.code),
    ).toEqual(['1', '2', '10']);
  });

  it('narrows to the selected codes and drops the unassigned buckets', () => {
    // `keep_unassigned` is false whenever codes are given, so the unassigned buckets are not
    // part of a drill-down: "outside all boundaries: 291" beside two districts is not an answer.
    const view = regionBreakdownView(rows, ['1']);

    expect(view.shown.map((row) => row.code)).toEqual(['1']);
    expect(view.unassigned).toEqual([]);
    // The picker still offers the unfiltered set, or a second region could never be chosen.
    expect(view.pickable.map((row) => row.code)).toEqual(['1', '2']);
    expect(view.filteredToName).toBe('District 1');
  });

  it('falls back to the code when a selected region has no name', () => {
    expect(regionBreakdownView(rows, ['2']).filteredToName).toBe('2');
  });

  it('reports no data when nothing has interactions', () => {
    expect(regionBreakdownView([unassigned({ count: 4 })], []).hasData).toBe(
      false,
    );
  });

  it('does not call a stale drill-down an empty range', () => {
    // The rollup is refetched unfiltered when the date range changes, so a region selected out
    // of the old window can be absent from the new one. The range still has located
    // interactions; reporting none unmounted `RegionMap` and collapsed the panel.
    const view = regionBreakdownView([region({ code: '2' })], ['1']);

    expect(view.assigned).toEqual([]);
    expect(view.hasData).toBe(true);
  });
});
