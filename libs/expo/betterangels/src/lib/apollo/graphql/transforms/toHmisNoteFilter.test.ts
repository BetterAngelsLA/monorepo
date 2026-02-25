/**
 * @jest-environment node
 */

import { toHmisNoteFilter } from './toHmisNoteFilter';

describe('toHmisNoteFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns {} when called with an empty object', () => {
    const result = toHmisNoteFilter({});

    expect(result).toEqual({});
  });

  it('omits keys that are undefined', () => {
    const result = toHmisNoteFilter({
      search: undefined,
      authors: undefined,
      hmisClientProfile: undefined,
      createdBy: undefined,
    });

    expect(result).toEqual({});
  });

  it('omits authors when the array is empty', () => {
    const result = toHmisNoteFilter({
      authors: [],
    });

    expect(result).toEqual({});
    expect('authors' in result).toBe(false);
  });

  it('includes authors when non-empty array is provided', () => {
    const result = toHmisNoteFilter({
      authors: ['a1', 'a2'],
    });

    expect(result).toEqual({
      authors: ['a1', 'a2'],
    });
  });

  it('includes search when it is non-empty (normalized by toNonEmptyStringOrUndefined)', () => {
    const result = toHmisNoteFilter({
      search: '  hello  ',
    });

    expect(result).toEqual({
      search: 'hello',
    });
  });

  it('omits search when it is empty or whitespace', () => {
    const result1 = toHmisNoteFilter({ search: '' });
    const result2 = toHmisNoteFilter({ search: '   ' });

    expect(result1).toEqual({});
    expect(result2).toEqual({});
    expect('search' in result1).toBe(false);
    expect('search' in result2).toBe(false);
  });

  it('includes hmisClientProfile and createdBy when they are non-empty (normalized)', () => {
    const result = toHmisNoteFilter({
      hmisClientProfile: '  hcp-1  ',
      createdBy: '  u-1 ',
    });

    expect(result).toEqual({
      hmisClientProfile: 'hcp-1',
      createdBy: 'u-1',
    });
  });

  it('omits hmisClientProfile and createdBy when empty/whitespace', () => {
    const result = toHmisNoteFilter({
      hmisClientProfile: '   ',
      createdBy: '',
    });

    expect(result).toEqual({});
    expect('hmisClientProfile' in result).toBe(false);
    expect('createdBy' in result).toBe(false);
  });

  it('does not mutate the input props object', () => {
    const input = {
      search: ' hello ',
      authors: ['a1'],
      hmisClientProfile: ' hcp-1 ',
      createdBy: ' u-1 ',
    };

    const snapshot = JSON.parse(JSON.stringify(input));

    toHmisNoteFilter(input);

    expect(input).toEqual(snapshot);
  });

  it('combines all supported fields and prunes only undefined/empty arrays/empty strings', () => {
    const result = toHmisNoteFilter({
      search: '  urgent  ',
      authors: [],
      hmisClientProfile: '  hcp-1 ',
      createdBy: '  user-1 ',
    });

    expect(result).toEqual({
      search: 'urgent',
      hmisClientProfile: 'hcp-1',
      createdBy: 'user-1',
    });
  });
});
