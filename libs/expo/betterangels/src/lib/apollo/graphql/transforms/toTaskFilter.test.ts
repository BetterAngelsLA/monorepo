/**
 * @jest-environment node
 */

import type { IdFilterLookup, TaskFilter } from '../__generated__/types';
import { SelahTeamEnum, TaskStatusEnum } from '../__generated__/types';
import { toTaskFilter } from './toTaskFilter';

describe('toTaskFilter', () => {
  it('returns an empty object when props are empty', () => {
    const result = toTaskFilter({});

    expect(result).toEqual({});
  });

  it('omits search when it is undefined, empty or whitespace', () => {
    const result1 = toTaskFilter({ search: undefined });
    const result2 = toTaskFilter({ search: '' });
    const result3 = toTaskFilter({ search: '   ' });

    expect(result1).toEqual({});
    expect(result2).toEqual({});
    expect(result3).toEqual({});
  });

  it('includes search when it is a non-empty string (trimmed)', () => {
    const result = toTaskFilter({ search: '  hello  ' });

    expect(result).toEqual({ search: 'hello' });
  });

  it('omits ID array filters when undefined', () => {
    const result = toTaskFilter({
      authors: undefined,
      organizations: undefined,
      clientProfiles: undefined,
      hmisClientProfiles: undefined,
    });

    expect(result).toEqual({});
    expect('authors' in result).toBe(false);
    expect('organizations' in result).toBe(false);
    expect('clientProfiles' in result).toBe(false);
    expect('hmisClientProfiles' in result).toBe(false);
  });

  it('omits ID array filters when empty array', () => {
    const result = toTaskFilter({
      authors: [],
      organizations: [],
      clientProfiles: [],
      hmisClientProfiles: [],
    });

    expect(result).toEqual({});
  });

  it('includes ID array filters when non-empty', () => {
    const result = toTaskFilter({
      authors: ['a1', 'a2'],
      organizations: ['o1'],
      clientProfiles: ['c1', 'c2', 'c3'],
      hmisClientProfiles: ['h1'],
    });

    expect(result).toEqual({
      authors: ['a1', 'a2'],
      organizations: ['o1'],
      clientProfiles: ['c1', 'c2', 'c3'],
      hmisClientProfiles: ['h1'],
    });
  });

  it('includes lookup filters when provided', () => {
    const hmisNote: IdFilterLookup = { exact: 'note-1' };
    const note: IdFilterLookup = { inList: ['n1', 'n2'] };
    const hmisClientProfileLookup: IdFilterLookup = { contains: 'abc' };
    const clientProfileLookup: IdFilterLookup = { isNull: true };

    const result = toTaskFilter({
      hmisNote,
      note,
      hmisClientProfileLookup,
      clientProfileLookup,
    });

    expect(result).toEqual({
      hmisNote,
      note,
      hmisClientProfileLookup,
      clientProfileLookup,
    });
  });

  it('omits teams when undefined', () => {
    const result = toTaskFilter({ teams: undefined });

    expect(result).toEqual({});
    expect('teams' in result).toBe(false);
  });

  it('omits teams when empty array', () => {
    const result = toTaskFilter({ teams: [] });

    expect(result).toEqual({});
    expect('teams' in result).toBe(false);
  });

  it('filters out invalid enum strings for teams', () => {
    const result = toTaskFilter({
      teams: ['ECHO_PARK_ON_SITE', 'NOT_A_TEAM', 'HOLLYWOOD_ON_SITE'],
    });

    expect(result).toEqual({
      teams: [SelahTeamEnum.EchoParkOnSite, SelahTeamEnum.HollywoodOnSite],
    });
  });

  it('omits teams if all provided values are invalid', () => {
    const result = toTaskFilter({
      teams: ['NOT_A_TEAM', 'ALSO_NOT_A_TEAM'],
    });

    expect(result).toEqual({});
    expect('teams' in result).toBe(false);
  });

  it('omits status when undefined', () => {
    const result = toTaskFilter({ taskStatus: undefined });

    expect(result).toEqual({});
    expect('status' in result).toBe(false);
  });

  it('omits status when empty array', () => {
    const result = toTaskFilter({ taskStatus: [] });

    expect(result).toEqual({});
    expect('status' in result).toBe(false);
  });

  it('filters out invalid enum strings for status', () => {
    const validStatuses = Object.values(TaskStatusEnum);

    // If your generated enum is empty for some reason, skip safely.
    if (validStatuses.length === 0) {
      const result = toTaskFilter({ taskStatus: ['ANYTHING'] });
      expect(result).toEqual({});
      return;
    }

    const firstValidStatus = validStatuses[0];

    const result = toTaskFilter({
      taskStatus: [String(firstValidStatus), 'NOT_A_STATUS'],
    });

    expect(result).toEqual({
      status: [firstValidStatus],
    });
  });

  it('omits status if all provided values are invalid', () => {
    const result = toTaskFilter({
      taskStatus: ['NOT_A_STATUS', 'ALSO_NOT_A_STATUS'],
    });

    expect(result).toEqual({});
    expect('status' in result).toBe(false);
  });

  it('combines multiple filters and prunes only the empty/undefined ones', () => {
    const note: IdFilterLookup = { exact: 'note-123' };

    const result = toTaskFilter({
      search: '  urgent ',
      authors: [],
      organizations: ['org-1'],
      teams: ['ECHO_PARK_ON_SITE', 'NOT_A_TEAM'],
      taskStatus: [],
      note,
    });

    expect(result).toEqual({
      search: 'urgent',
      organizations: ['org-1'],
      teams: [SelahTeamEnum.EchoParkOnSite],
      note,
    });
  });

  it('does not add unrelated TaskFilter fields', () => {
    const result = toTaskFilter({
      search: 'x',
      authors: ['a1'],
    });

    const keys = Object.keys(result).sort();

    expect(keys).toEqual(['authors', 'search']);
  });

  it('does not mutate the input props object', () => {
    const input = {
      search: ' hello ',
      authors: ['a1', 'a2'],
      teams: ['ECHO_PARK_ON_SITE'],
    };

    const snapshot = JSON.parse(JSON.stringify(input));

    toTaskFilter(input);

    expect(input).toEqual(snapshot);
  });

  it('type-level sanity: return is assignable to TaskFilter', () => {
    const result = toTaskFilter({
      search: 'x',
      organizations: ['o1'],
    });

    const typedResult: TaskFilter = result;

    expect(typedResult).toBe(result);
  });
});
