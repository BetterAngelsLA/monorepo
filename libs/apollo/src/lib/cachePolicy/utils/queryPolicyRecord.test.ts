import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_QUERY_RESULTS_KEY } from '../constants';
import { generateFieldPolicy } from '../generateFieldPolicy';
import { queryPolicyRecord } from './queryPolicyRecord';

vi.mock('../generateFieldPolicy', () => {
  return {
    generateFieldPolicy: vi.fn((_opts: { keyArgs: string[] }) => ({
      read: () => undefined,
      merge: () => undefined,
    })),
  };
});

// Minimal fake types
type TasksQuery = {
  __typename?: 'Query';
  tasks: {
    __typename?: 'TaskTypeOffsetPaginated';
    totalCount: number;
    results: Array<{ __typename?: 'TaskType'; id: string }>;
  };
};
type TasksQueryVariables = {
  filters?: { q?: string } | null;
  ordering?: { id?: 'ASC' | 'DESC' } | null;
  pagination?: { offset?: number; limit?: number } | null;
};

type UsersQuery = {
  __typename?: 'Query';
  interactionAuthors: {
    __typename?: 'InteractionAuthorTypeOffsetPaginated';
    totalCount: number;
    results: Array<{ __typename?: 'InteractionAuthorType'; id: string }>;
  };
};
type UsersQueryVariables = {
  filters?: { q?: string } | null;
  order?: { id?: 'ASC' | 'DESC' } | null;
  pagination?: { offset?: number; limit?: number } | null;
};

describe('queryPolicyRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buildFn returns entityTypename + a FieldPolicy; generateFieldPolicy receives keyArgs', () => {
    const rec = queryPolicyRecord<TasksQuery, TasksQueryVariables>({
      key: 'tasks',
      entityTypename: 'TaskType',
      keyArgs: ['filters', 'ordering'] as const,
    });

    // Assert default resultsKey via constant
    expect(rec.resultsKey).toBe(DEFAULT_QUERY_RESULTS_KEY);

    const built = rec.buildFn();
    expect(built.entityTypename).toBe('TaskType');
    expect(typeof built.fieldPolicy).toBe('object');

    const mockedGen = vi.mocked(generateFieldPolicy);
    expect(mockedGen).toHaveBeenCalledTimes(1);
    expect(mockedGen).toHaveBeenCalledWith(
      expect.objectContaining({ keyArgs: ['filters', 'ordering'] })
    );

    // Optional: ensure the array passed to generateFieldPolicy is cloned (defensive)
    const passedArgs = mockedGen.mock.calls[0][0].keyArgs;
    expect(passedArgs).toEqual(['filters', 'ordering']);
    expect(passedArgs).not.toBe(['filters', 'ordering'] as const); // not same ref
  });

  it('supports multiple records with different keyArgs', () => {
    const r1 = queryPolicyRecord<TasksQuery, TasksQueryVariables>({
      key: 'tasks',
      entityTypename: 'TaskType',
      keyArgs: ['filters', 'ordering'] as const,
    });

    const r2 = queryPolicyRecord<UsersQuery, UsersQueryVariables>({
      key: 'interactionAuthors',
      entityTypename: 'InteractionAuthorType',
      keyArgs: ['filters', 'order'] as const,
    });

    r1.buildFn();
    r2.buildFn();

    const mockedGen = vi.mocked(generateFieldPolicy);
    expect(mockedGen).toHaveBeenCalledTimes(2);

    const callsKeyArgs = mockedGen.mock.calls.map((c) => c[0]?.keyArgs);
    expect(callsKeyArgs).toEqual(
      expect.arrayContaining([
        ['filters', 'ordering'],
        ['filters', 'order'],
      ])
    );
  });

  it('accepts a custom resultsKey', () => {
    type ProductsQuery = {
      products: {
        customResultKey: Array<{ __typename?: 'ProductType'; id: string }>;
      };
    };
    type ProductsVars = { filters?: { q?: string } | null };

    const rec = queryPolicyRecord<
      ProductsQuery,
      ProductsVars,
      'customResultKey'
    >({
      key: 'products',
      resultsKey: 'customResultKey',
      entityTypename: 'ProductType',
      keyArgs: ['filters'] as const,
    });

    expect(rec.key).toBe('products');
    expect(rec.resultsKey).toBe('customResultKey');

    const built = rec.buildFn();
    expect(built.entityTypename).toBe('ProductType');
  });
});
