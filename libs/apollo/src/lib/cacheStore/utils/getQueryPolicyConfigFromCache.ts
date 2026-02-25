import { ApolloCache } from '@apollo/client';
import type { QueryPolicyConfig } from '../../cachePolicy/types/queryPolicyConfig';
import { getTypeFieldPolicyFromCache } from './getTypeFieldPolicyFromCache';

export function getQueryPolicyConfigFromCache(
  cache: ApolloCache,
  fieldName: string
): QueryPolicyConfig | undefined {
  const fieldPolicy = getTypeFieldPolicyFromCache(cache, 'Query', fieldName);

  return (fieldPolicy as any)?.__queryPolicyConfig as
    | QueryPolicyConfig
    | undefined;
}
