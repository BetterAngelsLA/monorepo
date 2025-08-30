import { type FieldPolicy } from '@apollo/client';

/** Field policies for Query (or any type) keyed by field name. */
export type FieldPoliciesMap = Record<
  string,
  FieldPolicy<Record<string, unknown>, Record<string, unknown>>
>;
