import { FieldPolicy, TypePolicies, TypePolicy } from '@apollo/client';
import { isDeepEqual } from 'remeda';
import { DEFAULT_QUERY_ID_KEY } from './constants';
import { TCachePolicyConfig } from './types';

type TKeyFields = TypePolicy['keyFields'];

export function generateCachePolicies(
  registry: TCachePolicyConfig
): TypePolicies {
  const queryFieldPolicies: Record<string, FieldPolicy> = {};
  const policiesByTypename: Record<string, TypePolicy> = {};

  for (const [fieldName, entry] of Object.entries(registry)) {
    const { fieldPolicy, entityTypename, keyFields, queryPolicyConfig } = entry;

    // 1) attach Query.<fieldName> field policies
    if (fieldPolicy) {
      const finalFieldPolicy: FieldPolicy = { ...fieldPolicy };

      if (queryPolicyConfig) {
        (finalFieldPolicy as any).__queryPolicyConfig = queryPolicyConfig;
      }

      queryFieldPolicies[fieldName] = finalFieldPolicy;
    }

    // 2) attach type policy if we have a typename
    if (!entityTypename) {
      continue;
    }

    const resolvedKeyFields = resolveKeyFields(keyFields);

    const existingPolicy = policiesByTypename[entityTypename];

    if (existingPolicy) {
      const existingKeyFields = existingPolicy.keyFields ?? null;
      const desiredKeyFields = resolvedKeyFields ?? null;

      if (!isDeepEqual(existingKeyFields, desiredKeyFields)) {
        console.warn(
          `[generateCachePolicies] Conflicting keyFields for ${entityTypename}. existing=${JSON.stringify(
            existingKeyFields
          )}, ignored=${JSON.stringify(desiredKeyFields)}`
        );
      }

      // keep the first one we saw
      continue;
    }

    policiesByTypename[entityTypename] = {
      keyFields: resolvedKeyFields,
    };
  }

  return {
    ...policiesByTypename,
    Query: {
      fields: queryFieldPolicies,
    },
  };
}

function resolveKeyFields(keyFields?: TKeyFields): TKeyFields {
  if (keyFields === false) {
    return false;
  }

  if (Array.isArray(keyFields)) {
    return keyFields;
  }

  return [DEFAULT_QUERY_ID_KEY];
}
