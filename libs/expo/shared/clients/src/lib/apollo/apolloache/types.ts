import { FieldPolicy, InMemoryCache, TypePolicies } from '@apollo/client';
import { TYPE_POLICIES_SYM } from './constants';

export type TCachePolicy = {
  modelName: string;
  modelPK?: string;
  fieldPolicy: FieldPolicy<Record<string, unknown>, Record<string, unknown>>;
};

export type TCachePoliyConfig = Record<string, TCachePolicy>;

export type TCacheWithPolicies = InMemoryCache & {
  [TYPE_POLICIES_SYM]: TypePolicies;
};
