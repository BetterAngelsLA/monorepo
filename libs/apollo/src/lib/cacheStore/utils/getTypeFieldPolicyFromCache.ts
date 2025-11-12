import type { ApolloCache, FieldPolicy } from '@apollo/client';
import { getTypePolicyFromCache } from './getTypePolicyFromCache';

export function getTypeFieldPolicyFromCache(
  cache: ApolloCache,
  typename: string,
  fieldName: string
): FieldPolicy | undefined {
  const typePolicy = getTypePolicyFromCache(cache, typename);
  const fields = typePolicy?.fields;

  return fields?.[fieldName] as FieldPolicy | undefined;
}
