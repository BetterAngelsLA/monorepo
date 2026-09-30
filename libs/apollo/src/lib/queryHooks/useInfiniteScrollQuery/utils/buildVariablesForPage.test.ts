import { describe, expect, it } from 'vitest';
import { buildVariablesForPage } from './buildVariablesForPage';

describe('buildVariablesForPage', () => {
  it('moves the cursor without mutating the base variables', () => {
    const base = {
      filters: { q: 'x' },
      pagination: { offset: 0, limit: 20 },
    };

    const next = buildVariablesForPage({
      baseVariables: base,
      offset: 40,
      paginationOffsetPath: ['pagination', 'offset'],
    });

    expect(next).toEqual({
      filters: { q: 'x' },
      pagination: { offset: 40, limit: 20 }, // the limit is carried over
    });

    // nested pagination is copied; untouched siblings keep their identity
    expect(base).toEqual({
      filters: { q: 'x' },
      pagination: { offset: 0, limit: 20 },
    });
    expect(next.pagination).not.toBe(base.pagination);
    expect(next.filters).toBe(base.filters);
  });

  it('moves the cursor on a deeply frozen base object', () => {
    const base = Object.freeze({
      filters: Object.freeze({ q: 'x' }),
      pagination: Object.freeze({ offset: 0, limit: 20 }),
    });

    const next = buildVariablesForPage({
      baseVariables: base,
      offset: 20,
      paginationOffsetPath: ['pagination', 'offset'],
    });

    expect(next).toEqual({
      filters: { q: 'x' },
      pagination: { offset: 20, limit: 20 },
    });
    expect(next.filters).toBe(base.filters);
  });

  it('uses the explicit cursor even when the base still points elsewhere', () => {
    // The cursor comes from the item count, not from the previous request
    // window — a reset that shrank the list must not be skipped over.
    const next = buildVariablesForPage({
      baseVariables: { pagination: { offset: 40, limit: 20 } },
      offset: 10,
      paginationOffsetPath: ['pagination', 'offset'],
    });

    expect(next).toEqual({ pagination: { offset: 10, limit: 20 } });
  });
});
