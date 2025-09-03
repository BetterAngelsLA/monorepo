import { FieldPolicy, TypePolicies, TypePolicy } from '@apollo/client';
import { TCachePolicyConfig } from './types';

const DEFAULT_KEY_FIELDS = ['id'] as const;

export function generateCachePolicies(
  registry: TCachePolicyConfig
): TypePolicies {
  const queryFields: Record<string, FieldPolicy> = {};
  const typePoliciesByName: Record<string, TypePolicy> = {};

  for (const [fieldName, entry] of Object.entries(registry)) {
    // 1) Attach Query field policy if provided
    if (entry.fieldPolicy) {
      queryFields[fieldName] = entry.fieldPolicy;
    }

    // 2) Attach entity type policy if entityTypename provided
    const entityTypename = entry.entityTypename;
    if (!entityTypename) {
      continue;
    }

    // Resolve desired keyFields
    // keyFields: ['id'] (default): normal entity with a stable id.
    // keyFields: ['a','b']: composite key when there’s no single id.
    // keyFields: false: value objects / payload wrappers you don’t want cached as entities.
    const desiredKeyFields: TypePolicy['keyFields'] =
      entry.keyFields === false
        ? false
        : Array.isArray(entry.keyFields)
        ? entry.keyFields
        : [...DEFAULT_KEY_FIELDS]; // default ['id']

    // De-dupe & guard conflicts
    const existingPolicy = typePoliciesByName[entityTypename];

    if (existingPolicy) {
      const a = JSON.stringify(existingPolicy.keyFields ?? null);
      const b = JSON.stringify(desiredKeyFields ?? null);

      if (a !== b && typeof console !== 'undefined') {
        console.warn(
          `[generateCachePolicies] Conflicting keyFields for ${entityTypename}. existing=${a}, ignored=${b}`
        );
      }

      continue;
    }

    typePoliciesByName[entityTypename] = { keyFields: desiredKeyFields };
  }

  return {
    ...typePoliciesByName,
    Query: { fields: queryFields },
  };
}
