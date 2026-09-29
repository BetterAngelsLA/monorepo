import { describe, expect, it } from 'vitest';
import { PaginationModeEnum } from '../../../cachePolicy';
import { buildInitialVariables } from './buildInitialVariables';

describe('buildInitialVariables', () => {
  it('normalizes offset pagination without mutating the caller variables', () => {
    const base = {
      filters: { q: 'x' },
      pagination: { offset: 0, limit: 20 },
    };

    const variables = buildInitialVariables({
      baseVariables: base,
      paginationMode: PaginationModeEnum.Offset,
      pageSize: 20,
    });

    expect(variables).toEqual({
      filters: { q: 'x' },
      pagination: { offset: 0, limit: 20 },
    });
    expect(base.pagination).toEqual({ offset: 0, limit: 20 });
    expect(variables.pagination).not.toBe(base.pagination);
    expect(variables.filters).toBe(base.filters);
  });

  it('creates missing pagination containers with defaults', () => {
    const base = { filters: { q: 'x' } };

    const variables = buildInitialVariables({
      baseVariables: base,
      paginationMode: PaginationModeEnum.Offset,
      pageSize: 15,
    });

    expect(variables).toEqual({
      filters: { q: 'x' },
      pagination: { offset: 0, limit: 15 },
    });
    expect(base).toEqual({ filters: { q: 'x' } });
  });

  it('clamps invalid values instead of writing them back to the caller object', () => {
    const base = { pagination: { offset: -5, limit: 0 } };

    const variables = buildInitialVariables({
      baseVariables: base,
      paginationMode: PaginationModeEnum.Offset,
      pageSize: 20,
    });

    expect(variables).toEqual({ pagination: { offset: 0, limit: 20 } });
    expect(base).toEqual({ pagination: { offset: -5, limit: 0 } });
  });

  it('pins a non-zero initial offset to the first page', () => {
    const base = { pagination: { offset: 100, limit: 20 } };

    const variables = buildInitialVariables({
      baseVariables: base,
      paginationMode: PaginationModeEnum.Offset,
      pageSize: 20,
    });

    expect(variables).toEqual({ pagination: { offset: 0, limit: 20 } });
    expect(base).toEqual({ pagination: { offset: 100, limit: 20 } });
  });

  it('pins a non-zero initial page to page 1', () => {
    const base = { pagination: { page: 7, perPage: 10 } };

    const variables = buildInitialVariables({
      baseVariables: base,
      paginationMode: PaginationModeEnum.PerPage,
      pageSize: 10,
    });

    expect(variables).toEqual({ pagination: { page: 1, perPage: 10 } });
    expect(base).toEqual({ pagination: { page: 7, perPage: 10 } });
  });

  it('defaults perPage pagination to page 1', () => {
    const variables = buildInitialVariables<Record<string, unknown>>({
      baseVariables: undefined,
      paginationMode: PaginationModeEnum.PerPage,
      pageSize: 10,
    });

    expect(variables).toEqual({ pagination: { page: 1, perPage: 10 } });
  });
});
