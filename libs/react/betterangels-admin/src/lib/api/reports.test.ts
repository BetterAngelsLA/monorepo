import { RegionDimension } from '@monorepo/ba-platform/types';
import { describe, expect, it } from 'vitest';
import { densityTileUrl, interactionExportUrl, regionTileUrl } from './reports';

describe('interactionExportUrl', () => {
  it('carries the grouped scope in the endpoint spelling', () => {
    // One spelling for the wire kind: the enum is uppercase, the endpoint reads lowercase.
    expect(
      interactionExportUrl({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        organizationId: '2',
        group: {
          dimension: RegionDimension.City,
          codes: ['beverly-hills', 'culver-city'],
        },
      }),
    ).toBe(
      '/reports/export/?start_date=2026-01-01&end_date=2026-01-31&org_id=2&dimension=city&codes=beverly-hills&codes=culver-city',
    );
  });

  it('omits the group entirely when the page is ungrouped', () => {
    expect(
      interactionExportUrl({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      }),
    ).toBe('/reports/export/?start_date=2026-01-01&end_date=2026-01-31');
  });

  it('omits codes when the grouping has no specific regions', () => {
    // Present-but-empty would mean "no region" and download an empty file; absent means every
    // region of the dimension.
    expect(
      interactionExportUrl({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        organizationId: '2',
        group: { dimension: RegionDimension.City, codes: [] },
      }),
    ).toBe(
      '/reports/export/?start_date=2026-01-01&end_date=2026-01-31&org_id=2&dimension=city',
    );
  });
});

describe('regionTileUrl', () => {
  it('lowercases the dimension to the wire kind', () => {
    expect(
      regionTileUrl('https://api.example.com', RegionDimension.CouncilDistrict),
    ).toBe(
      'https://api.example.com/regions/tiles/council_district/{z}/{x}/{y}.mvt',
    );
  });
});

describe('densityTileUrl', () => {
  it('carries the org and window without a group when no region is selected', () => {
    // A grouping with nothing selected must not change the URL: deck.gl caches by URL, and
    // every group-by would otherwise refetch identical tiles.
    expect(
      densityTileUrl({
        apiUrl: 'https://api.example.com',
        organizationId: '2',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        dimension: RegionDimension.City,
        codes: [],
      }),
    ).toBe(
      'https://api.example.com/regions/tiles/density/{z}/{x}/{y}.mvt?org_id=2&start=2026-01-01&end=2026-01-31',
    );
  });

  it('sorts the selected codes, so selection order is not a new tile URL', () => {
    expect(
      densityTileUrl({
        apiUrl: 'https://api.example.com',
        organizationId: '2',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        dimension: RegionDimension.City,
        codes: ['culver-city', 'beverly-hills'],
      }),
    ).toBe(
      'https://api.example.com/regions/tiles/density/{z}/{x}/{y}.mvt?org_id=2&start=2026-01-01&end=2026-01-31&dimension=city&codes=beverly-hills&codes=culver-city',
    );
  });
});
