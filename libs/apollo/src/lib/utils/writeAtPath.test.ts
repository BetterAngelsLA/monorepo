import { describe, expect, it } from 'vitest';
import { writeAtPath } from './writeAtPath';

describe('writeAtPath', () => {
  it('returns false when target is undefined', () => {
    expect(writeAtPath(undefined, 'a.b', 1)).toBe(false);
  });

  it('returns false when path is undefined', () => {
    const obj: Record<string, unknown> = {};

    expect(writeAtPath(obj, undefined, 1)).toBe(false);
  });

  it('writes a top-level key when path has one segment', () => {
    const obj: Record<string, unknown> = {};
    const ok = writeAtPath(obj, 'foo', 42);

    expect(ok).toBe(true);
    expect(obj).toEqual({ foo: 42 });
  });

  it('creates nested objects as needed for missing segments', () => {
    const obj: Record<string, unknown> = {};
    const ok = writeAtPath(obj, 'meta.pageInfo.limit', 25);

    expect(ok).toBe(true);
    expect(obj).toEqual({
      meta: {
        pageInfo: {
          limit: 25,
        },
      },
    });
  });

  it('returns false if it encounters a non-object mid-path', () => {
    const obj: Record<string, unknown> = {
      meta: 123, // not an object
    };

    const ok = writeAtPath(obj, 'meta.pageInfo.limit', 25);

    expect(ok).toBe(false);
    // object should stay unchanged
    expect(obj).toEqual({ meta: 123 });
  });

  it('accepts array-style paths', () => {
    const obj: Record<string, unknown> = {};
    const ok = writeAtPath(obj, ['filters', 'status'], 'OPEN');

    expect(ok).toBe(true);
    expect(obj).toEqual({
      filters: {
        status: 'OPEN',
      },
    });
  });

  it('overwrites existing value at final segment', () => {
    const obj: Record<string, unknown> = {
      pagination: {
        limit: 10,
      },
    };

    const ok = writeAtPath(obj, 'pagination.limit', 20);

    expect(ok).toBe(true);
    expect(obj['pagination']).toEqual({ limit: 20 });
  });

  it('returns false when target is not extensible (frozen)', () => {
    const obj: Record<string, unknown> = Object.freeze({});
    const ok = writeAtPath(obj, 'a.b', 1);

    expect(ok).toBe(false);
  });
});
