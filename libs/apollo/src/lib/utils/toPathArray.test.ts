import { describe, expect, it } from 'vitest';
import { toPathArray, toPathArrayStrict } from './toPathArray';

describe('toPathArray', () => {
  it('splits a dot-delimited string into an array', () => {
    expect(toPathArray('meta.totalCount')).toEqual(['meta', 'totalCount']);
  });

  it('returns a shallow copy when given an array', () => {
    const input = ['meta', 'totalCount'] as const;
    const result = toPathArray(input);
    expect(result).toEqual(['meta', 'totalCount']);
    expect(result).not.toBe(input);
  });

  it('returns undefined for falsy inputs (undefined, empty string)', () => {
    expect(toPathArray(undefined)).toBeUndefined();
    expect(toPathArray('')).toBeUndefined();
  });

  it('returns undefined for invalid non-string non-array inputs', () => {
    // @ts-expect-error runtime test
    expect(toPathArray(123)).toBeUndefined();
    // @ts-expect-error runtime test
    expect(toPathArray({})).toBeUndefined();
  });
});

describe('toPathArrayStrict', () => {
  it('returns a valid array for string or array inputs', () => {
    expect(toPathArrayStrict('a.b')).toEqual(['a', 'b']);
    expect(toPathArrayStrict(['x', 'y'])).toEqual(['x', 'y']);
  });

  it('throws for undefined or empty inputs', () => {
    expect(() => toPathArrayStrict(undefined)).toThrowError(
      /Expected a non-empty string or string\[\]/
    );
    // empty array → also invalid
    expect(() => toPathArrayStrict([])).toThrowError(
      /Expected a non-empty string or string\[\]/
    );
    // empty string → toPathArray(undefined) → throws
    expect(() => toPathArrayStrict('')).toThrowError(
      /Expected a non-empty string or string\[\]/
    );
  });

  it('throws for invalid types', () => {
    // @ts-expect-error runtime test
    expect(() => toPathArrayStrict(42)).toThrowError();
  });
});
