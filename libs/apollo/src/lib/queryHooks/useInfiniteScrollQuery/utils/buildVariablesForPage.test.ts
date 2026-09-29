import { describe, expect, it } from 'vitest';
import { PaginationModeEnum } from '../../../cachePolicy';
import { buildVariablesForPage } from './buildVariablesForPage';

describe('buildVariablesForPage', () => {
  it('builds the next offset page without mutating the previous variables', () => {
    const previous = {
      filters: { q: 'x' },
      pagination: { offset: 0, limit: 20 },
    };

    const next = buildVariablesForPage({
      previousVariables: previous,
      paginationMode: PaginationModeEnum.Offset,
      paginationOffsetPath: ['pagination', 'offset'],
      paginationLimitPath: ['pagination', 'limit'],
      incrementBy: 20,
    });

    expect(next).toEqual({
      filters: { q: 'x' },
      pagination: { offset: 20, limit: 20 },
    });

    // nested objects must not be shared with the previous variables
    expect(previous).toEqual({
      filters: { q: 'x' },
      pagination: { offset: 0, limit: 20 },
    });
    expect(next.pagination).not.toBe(previous.pagination);
  });

  it('builds the next page/perPage page without mutating the previous variables', () => {
    const previous = {
      pagination: { page: 1, perPage: 10 },
    };

    const next = buildVariablesForPage({
      previousVariables: previous,
      paginationMode: PaginationModeEnum.PerPage,
      paginationPagePath: ['pagination', 'page'],
      paginationPerPagePath: ['pagination', 'perPage'],
      incrementBy: 10,
    });

    expect(next).toEqual({ pagination: { page: 2, perPage: 10 } });
    expect(previous).toEqual({ pagination: { page: 1, perPage: 10 } });
  });
});
