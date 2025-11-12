import { FieldPolicy, InMemoryCache, TypePolicies } from '@apollo/client';
import { TYPE_POLICIES_SYM } from '../constants';
import { QueryPolicyConfig } from './queryPolicyConfig';

/** Represents a single field policy entry */
export type TCachePolicyEntry = {
  entityTypename: string;
  keyFields?: string[] | false;
  fieldPolicy: FieldPolicy<Record<string, unknown>, Record<string, unknown>>;
  queryPolicyConfig?: QueryPolicyConfig;
};

/** Registry of all field policies by query field name */
export type TCachePolicyConfig = Record<string, TCachePolicyEntry>;

/** Extended cache that also carries attached policies */
export type TCacheWithPolicies = InMemoryCache & {
  [TYPE_POLICIES_SYM]: TypePolicies;
};
