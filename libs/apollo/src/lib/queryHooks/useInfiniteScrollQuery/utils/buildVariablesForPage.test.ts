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

    // nested pagination is copied; untouched siblings keep their identity
    expect(previous).toEqual({
      filters: { q: 'x' },
      pagination: { offset: 0, limit: 20 },
    });
    expect(next.pagination).not.toBe(previous.pagination);
    expect(next.filters).toBe(previous.filters);
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
    expect(next.pagination).not.toBe(previous.pagination);
  });

  it('builds next page variables from a deeply frozen previous variables object', () => {
    const previous = Object.freeze({
      filters: Object.freeze({ q: 'x' }),
      pagination: Object.freeze({ offset: 0, limit: 20 }),
    });

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
    expect(next.filters).toBe(previous.filters);
  });

  it('falls back to empty variables when nothing has been paginated yet', () => {
    const next = buildVariablesForPage<Record<string, unknown>>({
      previousVariables: undefined,
      paginationMode: PaginationModeEnum.Offset,
      paginationOffsetPath: ['pagination', 'offset'],
      paginationLimitPath: ['pagination', 'limit'],
      incrementBy: 20,
    });

    expect(next).toEqual({ pagination: { offset: 20, limit: 20 } });
  });
});
