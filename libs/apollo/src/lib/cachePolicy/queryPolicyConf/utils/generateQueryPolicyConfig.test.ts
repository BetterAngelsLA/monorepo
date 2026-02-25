/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_QUERY_RESULTS_KEY,
  DEFAULT_QUERY_TOTAL_COUNT_KEY,
  PaginationModeEnum,
} from '../../constants';
import { generateQueryPolicyConfig } from './generateQueryPolicyConfig';

// we want to test OUR logic here, not the pagination util’s logic,
// so we can mock getPaginationVarsPerMode to return predictable shapes
vi.mock('./getPaginationVarsPerMode', () => ({
  getPaginationVarsPerMode: vi.fn((mode: any, vars: any) => {
    // emulate the real behavior enough for tests
    if (mode === PaginationModeEnum.Offset) {
      return {
        mode,
        offsetPath: vars?.offsetPath ?? ['pagination', 'offset'],
        limitPath: vars?.limitPath ?? ['pagination', 'limit'],
      };
    }

    return {
      mode,
      pagePath: vars?.pagePath ?? ['pagination', 'page'],
      perPagePath: vars?.perPagePath ?? ['pagination', 'perPage'],
    };
  }),
}));

describe('generateQueryPolicyConfig', () => {
  it('returns offset-based config by default', async () => {
    const cfg = generateQueryPolicyConfig({});

    expect(cfg).toEqual({
      paginationMode: PaginationModeEnum.Offset,
      itemsPath: [DEFAULT_QUERY_RESULTS_KEY],
      totalCountPath: [DEFAULT_QUERY_TOTAL_COUNT_KEY],
      paginationOffsetPath: ['pagination', 'offset'],
      paginationLimitPath: ['pagination', 'limit'],
    });
  });

  it('supports per-page mode and returns page/perPage paths', () => {
    const cfg = generateQueryPolicyConfig({
      paginationMode: PaginationModeEnum.PerPage,
    });

    expect(cfg).toEqual({
      paginationMode: PaginationModeEnum.PerPage,
      itemsPath: [DEFAULT_QUERY_RESULTS_KEY],
      totalCountPath: [DEFAULT_QUERY_TOTAL_COUNT_KEY],
      paginationPagePath: ['pagination', 'page'],
      paginationPerPagePath: ['pagination', 'perPage'],
    });
  });

  it('normalizes string paths to arrays', () => {
    const cfg = generateQueryPolicyConfig({
      itemsPath: 'data.items',
      totalCountPath: 'data.total',
      paginationMode: PaginationModeEnum.PerPage,
      paginationVariables: {
        mode: PaginationModeEnum.PerPage,
        pagePath: 'pagination.page',
        perPagePath: 'pagination.pageSize',
      },
    });

    expect(cfg.itemsPath).toEqual(['data', 'items']);
    expect(cfg.totalCountPath).toEqual(['data', 'total']);
    expect(cfg.paginationPagePath).toEqual(['pagination', 'page']);
    expect(cfg.paginationPerPagePath).toEqual(['pagination', 'pageSize']);
  });

  it('respects incoming paginationVariables for offset mode', () => {
    const cfg = generateQueryPolicyConfig({
      paginationMode: PaginationModeEnum.Offset,
      paginationVariables: {
        mode: PaginationModeEnum.Offset,
        offsetPath: ['page', 'offset'],
        limitPath: ['page', 'limit'],
      },
    });

    expect(cfg.paginationOffsetPath).toEqual(['page', 'offset']);
    expect(cfg.paginationLimitPath).toEqual(['page', 'limit']);
  });

  it('throws when itemsPath becomes empty after normalization', () => {
    expect(() => generateQueryPolicyConfig({ itemsPath: '' })).toThrow(
      '[buildQueryPolicyConfig] itemsPath must be a non-empty string or string[]'
    );
  });
});
