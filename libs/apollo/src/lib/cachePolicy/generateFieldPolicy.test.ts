import type { FieldPolicy } from '@apollo/client';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import { generateFieldPolicy } from './generateFieldPolicy';
import { generateMergeFn } from './merge';

// 🔁 Mock BEFORE importing the SUT. Define mocks INSIDE the factory (no top-level refs).
vi.mock('./merge', () => {
  // create a mock factory that returns a merge function mock
  const generateMergeFn = vi.fn((opts?: any) => {
    // merge function that exercises readExisting/mergeResults if provided
    const mergeFn = vi.fn((existing: any, incoming: any, context: any) => {
      if (opts && (opts.readExisting || opts.mergeResults)) {
        const readExisting = opts.readExisting ?? ((ex: any) => ex ?? []);
        const existingList = readExisting(existing);

        const offset =
          context?.offset ??
          context?.args?.pagination?.offset ??
          context?.args?.offset ??
          0;

        const mergeResults =
          opts.mergeResults ?? ((_ex: any[], inc: any[]) => inc);
        return mergeResults(existingList, incoming, { offset });
      }
      // default passthrough
      return incoming;
    });
    return mergeFn;
  });

  return { generateMergeFn };
});

function narrowMerge(p: FieldPolicy) {
  expect(typeof p.merge).toBe('function');
  return p.merge as (existing: any, incoming: any, context: any) => any;
}

describe('generateFieldPolicy', () => {
  let warnSpy: MockInstance<[message?: any, ...optionalParams: any[]], void>;

  beforeEach(() => {
    vi.clearAllMocks();
    warnSpy = vi
      .spyOn(console, 'warn')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {}) as unknown as MockInstance<
      [message?: any, ...optionalParams: any[]],
      void
    >;
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('passes keyArgs through (array) and wires merge from generateMergeFn', () => {
    const policy = generateFieldPolicy<
      { id: number },
      { pagination?: { offset?: number; limit?: number } }
    >({
      keyArgs: ['filters', 'order'],
    });

    expect(policy.keyArgs).toEqual(['filters', 'order']);
    expect(typeof policy.merge).toBe('function');

    // first call without mergeOpts -> undefined
    expect(
      (generateMergeFn as unknown as MockInstance).mock.calls[0][0]
    ).toBeUndefined();
  });

  it('passes keyArgs through (false)', () => {
    const policy = generateFieldPolicy({ keyArgs: false });
    expect(policy.keyArgs).toBe(false);
    expect(typeof policy.merge).toBe('function');
  });

  it('integration: merge uses provided readExisting + mergeResults', () => {
    // Cast for convenience in tests (we’re already mocking internals)
    const mergeOpts = {
      readExisting: (existing: any) => existing?.results ?? [],
      mergeResults: (
        existing: string[],
        incoming: string[],
        { offset }: { offset: number }
      ) => {
        const merged = existing.slice();
        for (let i = 0; i < incoming.length; i++) {
          merged[offset + i] = incoming[i];
        }
        return merged;
      },
    } as any;

    const policy = generateFieldPolicy<
      string,
      { pagination?: { offset?: number; limit?: number } }
    >({
      keyArgs: ['filters'],
      mergeOpts,
    });

    // ensure mocked generateMergeFn received our options
    const calls = (generateMergeFn as unknown as MockInstance).mock.calls;
    expect(calls[calls.length - 1][0]).toBe(mergeOpts);

    const existing = { results: ['A', 'B'] };
    const incoming = ['C', 'D'];
    const context = { args: { pagination: { offset: 1, limit: 2 } } };

    const result = narrowMerge(policy)(existing, incoming, context);
    expect(result).toEqual(['A', 'C', 'D']);
  });

  it('merge falls back to passthrough when no mergeOpts provided', () => {
    const policy = generateFieldPolicy<number>({ keyArgs: ['filters'] });
    const result = narrowMerge(policy)({ results: [1, 2, 3] }, [9, 8], {
      args: { offset: 0 },
    });

    expect(result).toEqual([9, 8]);
  });
});
