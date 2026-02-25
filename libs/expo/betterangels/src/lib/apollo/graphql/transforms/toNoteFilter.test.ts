/**
 * @jest-environment node
 */

import { SelahTeamEnum } from '../__generated__/types';
import { toNoteFilter } from './toNoteFilter';

describe('toNoteFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns {} when called with an empty object', () => {
    const result = toNoteFilter({});

    expect(result).toEqual({});
  });

  it('omits keys that are undefined', () => {
    const result = toNoteFilter({
      search: undefined,
      authors: undefined,
      organizations: undefined,
      teams: undefined,
      clientProfile: undefined,
      createdBy: undefined,
      isSubmitted: undefined,
    });

    expect(result).toEqual({});
  });

  it('omits array keys when the array is empty', () => {
    const result = toNoteFilter({
      authors: [],
      organizations: [],
      teams: [],
    });

    expect(result).toEqual({});
    expect('authors' in result).toBe(false);
    expect('organizations' in result).toBe(false);
    expect('teams' in result).toBe(false);
  });

  it('keeps boolean false (does not prune falsy values other than undefined)', () => {
    const result = toNoteFilter({
      isSubmitted: false,
    });

    expect(result).toEqual({ isSubmitted: false });
  });

  it('keeps boolean true', () => {
    const result = toNoteFilter({
      isSubmitted: true,
    });

    expect(result).toEqual({ isSubmitted: true });
  });

  it('includes search when it is non-empty (normalized by toNonEmptyStringOrUndefined)', () => {
    const result = toNoteFilter({
      search: '  hello  ',
    });

    expect(result).toEqual({ search: 'hello' });
  });

  it('omits search when it is empty or whitespace', () => {
    const result1 = toNoteFilter({ search: '' });
    const result2 = toNoteFilter({ search: '   ' });

    expect(result1).toEqual({});
    expect(result2).toEqual({});
    expect('search' in result1).toBe(false);
    expect('search' in result2).toBe(false);
  });

  it('includes clientProfile and createdBy when they are non-empty (normalized)', () => {
    const result = toNoteFilter({
      clientProfile: '  cp-1  ',
      createdBy: '  u-1 ',
    });

    expect(result).toEqual({
      clientProfile: 'cp-1',
      createdBy: 'u-1',
    });
  });

  it('omits clientProfile and createdBy when empty/whitespace', () => {
    const result = toNoteFilter({
      clientProfile: '   ',
      createdBy: '',
    });

    expect(result).toEqual({});
    expect('clientProfile' in result).toBe(false);
    expect('createdBy' in result).toBe(false);
  });

  it('includes authors and organizations when non-empty arrays are provided', () => {
    const result = toNoteFilter({
      authors: ['a1', 'a2'],
      organizations: ['o1'],
    });

    expect(result).toEqual({
      authors: ['a1', 'a2'],
      organizations: ['o1'],
    });
  });

  it('filters teams to valid SelahTeamEnum values and omits invalid strings', () => {
    const result = toNoteFilter({
      teams: ['ECHO_PARK_ON_SITE', 'NOT_A_TEAM', 'HOLLYWOOD_ON_SITE'],
    });

    expect(result).toEqual({
      teams: [SelahTeamEnum.EchoParkOnSite, SelahTeamEnum.HollywoodOnSite],
    });
  });

  it('omits teams entirely if all team values are invalid', () => {
    const result = toNoteFilter({
      teams: ['NOT_A_TEAM', 'ALSO_NOT_A_TEAM'],
    });

    expect(result).toEqual({});
    expect('teams' in result).toBe(false);
  });

  it('does not mutate the input props object', () => {
    const input = {
      search: ' hello ',
      authors: ['a1'],
      organizations: ['o1'],
      teams: ['ECHO_PARK_ON_SITE'],
      clientProfile: ' cp-1 ',
      createdBy: ' u-1 ',
      isSubmitted: false,
    };

    const snapshot = JSON.parse(JSON.stringify(input));

    toNoteFilter(input);

    expect(input).toEqual(snapshot);
  });

  it('combines all supported fields and prunes only undefined/empty arrays/empty strings', () => {
    const result = toNoteFilter({
      search: '  urgent  ',
      authors: [],
      organizations: ['org-1'],
      teams: ['ECHO_PARK_ON_SITE', 'INVALID'],
      clientProfile: '  cp-1 ',
      createdBy: '  user-1 ',
      isSubmitted: false,
    });

    expect(result).toEqual({
      search: 'urgent',
      organizations: ['org-1'],
      teams: [SelahTeamEnum.EchoParkOnSite],
      clientProfile: 'cp-1',
      createdBy: 'user-1',
      isSubmitted: false,
    });
  });
});
