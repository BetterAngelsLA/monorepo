import { describe, expect, it } from 'vitest';
import { withValueAtPath } from './withValueAtPath';

describe('withValueAtPath', () => {
  it('sets a nested value and returns a new object', () => {
    const original = {
      filters: { q: 'x' },
      pagination: { offset: 0, limit: 20 },
    };

    const next = withValueAtPath(original, ['pagination', 'offset'], 40);

    expect(next).toEqual({
      filters: { q: 'x' },
      pagination: { offset: 40, limit: 20 },
    });
    expect(next).not.toBe(original);
  });

  it('never mutates the input and shares untouched sub-trees by reference', () => {
    const original = {
      filters: { q: 'x' },
      pagination: { offset: 0, limit: 20 },
    };

    const next = withValueAtPath(original, ['pagination', 'offset'], 40);

    expect(original).toEqual({
      filters: { q: 'x' },
      pagination: { offset: 0, limit: 20 },
    });
    expect(next.pagination).not.toBe(original.pagination);
    expect(next.filters).toBe(original.filters);
  });

  it('creates missing intermediate containers', () => {
    const original = { filters: { q: 'x' } };

    const next = withValueAtPath(original, ['pagination', 'offset'], 20);

    expect(next).toEqual({
      filters: { q: 'x' },
      pagination: { offset: 20 },
    });
    expect(original).toEqual({ filters: { q: 'x' } });
  });

  it('accepts dot-delimited string paths', () => {
    const next = withValueAtPath(
      { meta: { totalCount: 1 } },
      'meta.totalCount',
      2,
    );

    expect(next).toEqual({ meta: { totalCount: 2 } });
  });

  it('copies arrays along the path instead of mutating them', () => {
    const original = {
      ordering: ['createdAt'],
      groups: [{ page: 1 }],
    };

    const next = withValueAtPath(original, ['groups', '0', 'page'], 2);

    expect(next.groups[0]).toEqual({ page: 2 });
    expect(next.groups).not.toBe(original.groups);
    expect(original.groups[0]).toEqual({ page: 1 });
    expect(next.ordering).toBe(original.ordering);
  });

  it('works with deeply frozen inputs', () => {
    const original = Object.freeze({
      filters: Object.freeze({ q: 'x' }),
      pagination: Object.freeze({ offset: 0, limit: 20 }),
    });

    const next = withValueAtPath(original, ['pagination', 'offset'], 40);

    expect(next).toEqual({
      filters: { q: 'x' },
      pagination: { offset: 40, limit: 20 },
    });
  });

  it('returns the input unchanged when an intermediate segment is a scalar', () => {
    const original = { pagination: 5 };

    const next = withValueAtPath(original, ['pagination', 'offset'], 20);

    expect(next).toBe(original);
  });

  it('returns the input unchanged for empty or invalid paths', () => {
    const original = { a: 1 };

    expect(withValueAtPath(original, undefined, 2)).toBe(original);
    expect(withValueAtPath(original, [], 2)).toBe(original);
  });
});
