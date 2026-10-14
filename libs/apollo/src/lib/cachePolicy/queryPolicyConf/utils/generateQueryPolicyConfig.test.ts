import { describe, expect, it } from 'vitest';
import {
  DEFAULT_QUERY_RESULTS_KEY,
  DEFAULT_QUERY_TOTAL_COUNT_KEY,
  PaginationModeEnum,
} from '../../constants';
import { generateQueryPolicyConfig } from './generateQueryPolicyConfig';

describe('generateQueryPolicyConfig', () => {
  it('returns offset-based config by default', () => {
    const cfg = generateQueryPolicyConfig({});

    expect(cfg).toEqual({
      paginationMode: PaginationModeEnum.Offset,
      itemsPath: [DEFAULT_QUERY_RESULTS_KEY],
      totalCountPath: [DEFAULT_QUERY_TOTAL_COUNT_KEY],
      paginationOffsetPath: ['pagination', 'offset'],
      paginationLimitPath: ['pagination', 'limit'],
    });
  });

  it('normalizes string paths to arrays', () => {
    const cfg = generateQueryPolicyConfig({
      itemsPath: 'data.items',
      totalCountPath: 'data.total',
      paginationVariables: {
        mode: PaginationModeEnum.Offset,
        offsetPath: 'pagination.page',
        limitPath: 'pagination.pageSize',
      },
    });

    expect(cfg.itemsPath).toEqual(['data', 'items']);
    expect(cfg.totalCountPath).toEqual(['data', 'total']);
    expect(cfg.paginationOffsetPath).toEqual(['pagination', 'page']);
    expect(cfg.paginationLimitPath).toEqual(['pagination', 'pageSize']);
  });

  it('respects incoming paginationVariables paths', () => {
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
      '[buildQueryPolicyConfig] itemsPath must be a non-empty string or string[]',
    );
  });
});
