import { describe, expect, it } from 'vitest';
import { readAtPath } from './readAtPath';

describe('readAtPath', () => {
  it('returns undefined when value is falsy', () => {
    expect(readAtPath(undefined, 'a.b')).toBeUndefined();
    expect(readAtPath(null, 'a.b')).toBeUndefined();
  });

  it('returns undefined when path is missing or empty', () => {
    expect(readAtPath({ a: 1 }, undefined)).toBeUndefined();
    expect(readAtPath({ a: 1 }, '')).toBeUndefined();
    expect(readAtPath({ a: 1 }, [])).toBeUndefined();
  });

  it('reads a top-level property from object', () => {
    const obj = { a: 123 };
    expect(readAtPath<number>(obj, 'a')).toBe(123);
  });

  it('reads a nested property from object using dot string', () => {
    const obj = { meta: { totalCount: 5 } };
    expect(readAtPath<number>(obj, 'meta.totalCount')).toBe(5);
  });

  it('reads a nested property from object using array path', () => {
    const obj = { meta: { totalCount: 5 } };
    expect(readAtPath<number>(obj, ['meta', 'totalCount'])).toBe(5);
  });

  it('returns undefined if any path segment is missing', () => {
    const obj = { meta: { totalCount: 5 } };
    expect(readAtPath(obj, 'meta.missing')).toBeUndefined();
    expect(readAtPath(obj, 'root.meta.totalCount')).toBeUndefined();
  });

  it('returns undefined if we hit a non-object before finishing the path', () => {
    const obj = { meta: 123 };
    // meta is a number, so meta.totalCount should fail
    expect(readAtPath(obj, 'meta.totalCount')).toBeUndefined();
  });

  it('works with array-like paths in objects', () => {
    const obj = { data: { items: [{ id: 1 }, { id: 2 }] } };
    // NOTE: readAtPath doesn’t index into arrays, it only does object keys,
    // so this should return the array, not items[0]
    expect(readAtPath(obj, 'data.items')).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('preserves the generic type when provided', () => {
    const obj = { meta: { totalCount: 5 } };
    const result = readAtPath<number>(obj, 'meta.totalCount');
    // just assert it’s still the number
    expect(result).toBe(5);
  });
});
