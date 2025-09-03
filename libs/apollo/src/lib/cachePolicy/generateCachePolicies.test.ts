import type { FieldPolicy, TypePolicies } from '@apollo/client';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import { generateCachePolicies } from './generateCachePolicies';
import type { TCachePolicyConfig } from './types';

function fp(partial: Partial<FieldPolicy>): FieldPolicy {
  return {
    ...(partial.read ? { read: partial.read } : {}),
    ...(partial.merge ? { merge: partial.merge as any } : {}),
    ...(partial.keyArgs !== undefined ? { keyArgs: partial.keyArgs } : {}),
  };
}

const getType = (p: TypePolicies, name: string) =>
  p[name] as unknown as { keyFields?: any };

const getQueryFields = (p: TypePolicies) =>
  (p['Query'] as unknown as { fields: Record<string, FieldPolicy> }).fields;

describe('generateCachePolicies', () => {
  let warnSpy: MockInstance<[message?: any, ...optionalParams: any[]], void>;

  beforeEach(() => {
    warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {}) as unknown as MockInstance<
      [message?: any, ...optionalParams: any[]],
      void
    >;
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('attaches Query field policies and creates default/explicit/false keyFields', () => {
    const registry: TCachePolicyConfig = {
      tasks: {
        entityTypename: 'Task',
        fieldPolicy: fp({ keyArgs: ['filters', 'order'] }),
      },
      users: {
        entityTypename: 'User',
        keyFields: false,
        fieldPolicy: fp({ keyArgs: false }),
      },
    };

    const policies = generateCachePolicies(registry);
    const queryFields = getQueryFields(policies);

    expect(queryFields).toHaveProperty('tasks');
    expect(queryFields['tasks']).toMatchObject({
      keyArgs: ['filters', 'order'],
    });

    expect(queryFields).toHaveProperty('users');
    expect(queryFields['users']).toMatchObject({ keyArgs: false });

    expect(getType(policies, 'Task').keyFields).toEqual(['id']);
    expect(getType(policies, 'User').keyFields).toBe(false);
  });

  it('respects explicit composite keyFields array', () => {
    const registry: TCachePolicyConfig = {
      composite: {
        entityTypename: 'Composite',
        keyFields: ['a', 'b'],
        fieldPolicy: fp({ keyArgs: ['filters'] }),
      },
    };
    const policies = generateCachePolicies(registry);
    expect(getType(policies, 'Composite').keyFields).toEqual(['a', 'b']);
  });

  it('warns on conflicting keyFields for the same typename and keeps the first', () => {
    const registry: TCachePolicyConfig = {
      first: {
        entityTypename: 'Thing',
        keyFields: ['id'],
        fieldPolicy: fp({}),
      },
      second: {
        entityTypename: 'Thing',
        keyFields: ['otherId'],
        fieldPolicy: fp({}),
      },
    };

    const policies = generateCachePolicies(registry);

    expect(getType(policies, 'Thing').keyFields).toEqual(['id']);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Conflicting keyFields for Thing')
    );
  });
});
