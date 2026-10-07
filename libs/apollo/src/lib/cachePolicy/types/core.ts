import { FieldPolicy, TypePolicy } from '@apollo/client';
import { QueryPolicyConfig } from './queryPolicyConfig';

/** Represents a single field policy entry */
export type TCachePolicyEntry = {
  entityTypename: string;
  keyFields?: TypePolicy['keyFields'];
  fieldPolicy: FieldPolicy<Record<string, unknown>, Record<string, unknown>>;
  queryPolicyConfig?: QueryPolicyConfig;
};

/** Registry of all field policies by query field name */
export type TCachePolicyConfig = Record<string, TCachePolicyEntry>;
