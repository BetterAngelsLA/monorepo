import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import { PaginationModeEnum } from './constants';
import { generateFieldPolicy } from './generateFieldPolicy';
import type { QueryPolicyConfig } from './types';

// mock the module we delegate to
vi.mock('./merge', () => {
  const generateMergeFn = vi.fn((_mergeOpts?: any, _paginationVars?: any) => {
    // return a dummy merge function Apollo would call
    return vi.fn((existing: any, incoming: any) => {
      return incoming ?? existing;
    });
  });

  return { generateMergeFn };
});

describe('generateFieldPolicy', () => {
  let warnSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  const offsetQueryPolicy: QueryPolicyConfig = {
    paginationMode: PaginationModeEnum.Offset,
    itemsPath: ['results'],
    totalCountPath: ['totalCount'],
    paginationOffsetPath: ['pagination', 'offset'],
    paginationLimitPath: ['pagination', 'limit'],
  };

  const perPageQueryPolicy: QueryPolicyConfig = {
    paginationMode: PaginationModeEnum.PerPage,
    itemsPath: ['results'],
    totalCountPath: ['totalCount'],
    paginationPagePath: ['pagination', 'page'],
    paginationPerPagePath: ['pagination', 'perPage'],
  };

  it('keeps keyArgs (array) and wires merge with offset pagination', async () => {
    const policy = generateFieldPolicy({
      keyArgs: ['filters', 'order'],
      queryPolicyConfig: offsetQueryPolicy,
    });

    expect(policy.keyArgs).toEqual(['filters', 'order']);
    expect(
      typeof policy.merge === 'function' || typeof policy.merge === 'boolean'
    ).toBe(true);

    // ✅ use dynamic import so ESM/vitest is happy
    const mockedModule = await import('./merge');
    const mockedGenerateMergeFn =
      mockedModule.generateMergeFn as unknown as MockInstance;

    // first call should have derived offset vars
    expect(mockedGenerateMergeFn.mock.calls[0][0]).toBeUndefined();
    expect(mockedGenerateMergeFn.mock.calls[0][1]).toEqual({
      mode: PaginationModeEnum.Offset,
      offsetPath: ['pagination', 'offset'],
      limitPath: ['pagination', 'limit'],
    });
  });

  it('keeps keyArgs (false) and wires merge with per-page pagination', async () => {
    const policy = generateFieldPolicy({
      keyArgs: false,
      queryPolicyConfig: perPageQueryPolicy,
    });

    expect(policy.keyArgs).toBe(false);
    expect(
      typeof policy.merge === 'function' || typeof policy.merge === 'boolean'
    ).toBe(true);

    const mockedModule = await import('./merge');
    const mockedGenerateMergeFn =
      mockedModule.generateMergeFn as unknown as MockInstance;

    expect(mockedGenerateMergeFn.mock.calls[0][1]).toEqual({
      mode: PaginationModeEnum.PerPage,
      pagePath: ['pagination', 'page'],
      perPagePath: ['pagination', 'perPage'],
    });
  });

  it('forwards mergeOpts and uses pagination derived from queryPolicyConfig', async () => {
    const mergeOpts = {
      mode: 'ARRAY',
    } as any;

    const policy = generateFieldPolicy({
      keyArgs: ['filters'],
      mergeOpts,
      queryPolicyConfig: offsetQueryPolicy,
    });

    const mergeFn = policy.merge;

    // narrow to callable (Apollo types allow true/false)
    if (typeof mergeFn === 'function') {
      mergeFn({ results: [1] }, { results: [2] }, {} as any);
    } else {
      throw new Error('mergeFn was not a function');
    }

    const mockedModule = await import('./merge');
    const mockedGenerateMergeFn =
      mockedModule.generateMergeFn as unknown as MockInstance;
    const lastCall =
      mockedGenerateMergeFn.mock.calls[
        mockedGenerateMergeFn.mock.calls.length - 1
      ];

    expect(lastCall[0]).toBe(mergeOpts);
    expect(lastCall[1]).toEqual({
      mode: PaginationModeEnum.Offset,
      offsetPath: ['pagination', 'offset'],
      limitPath: ['pagination', 'limit'],
    });
  });

  it('uses the mocked merge fn to return incoming', async () => {
    const policy = generateFieldPolicy<number>({
      keyArgs: ['filters'],
      queryPolicyConfig: offsetQueryPolicy,
    });

    const mergeFn = policy.merge;

    if (typeof mergeFn === 'function') {
      const result = mergeFn({ results: [1, 2, 3] }, [9, 8], {
        args: { offset: 0 },
      } as any);

      expect(result).toEqual([9, 8]);
    } else {
      throw new Error('mergeFn was not a function');
    }
  });
});
