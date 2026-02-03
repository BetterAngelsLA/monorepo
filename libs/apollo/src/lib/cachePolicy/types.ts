import { FieldPolicy, InMemoryCache, TypePolicies } from '@apollo/client';
import { TYPE_POLICIES_SYM } from './constants';

export type TCachePolicyEntry = {
  entityTypename: string;
  // keyFields: used to normalize this typename in the entity cache.
  // - omit => default to ['id']
  // - string[] => composite or custom key
  // - false => do NOT normalize (value object/wrapper)
  keyFields?: string[] | false;
  fieldPolicy: FieldPolicy<Record<string, unknown>, Record<string, unknown>>;
};

export type TCachePolicyConfig = Record<string, TCachePolicyEntry>;

// extended type to allow referencing TypePolicies attached to the cache store.
// primiarily used for validation that a query has a policy (when necessary)
export type TCacheWithPolicies = InMemoryCache & {
  [TYPE_POLICIES_SYM]: TypePolicies;
};
