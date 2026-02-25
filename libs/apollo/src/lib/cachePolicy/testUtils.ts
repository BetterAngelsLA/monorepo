import type { FieldPolicy } from '@apollo/client';
import { expect } from 'vitest';

export function getPolicyMergeFn(policy: FieldPolicy) {
  expect(typeof policy.merge).toBe('function');

  return policy.merge as (
    existing: unknown,
    incoming: unknown,
    context: unknown
  ) => unknown;
}
