/**
 * generateCachePolicies
 *
 * Utility to build a complete Apollo `TypePolicies` object from a simple
 * registry of field and entity configurations.
 *
 * It centralizes how you define cache policies (keyFields, merge policies, etc.)
 * so your Apollo Client setup can consume them in one place.
 *
 * --------------------------------------------------------------------
 * Usage
 * --------------------------------------------------------------------
 *
 * // 1. Define your registry describing query fields + entity types:
 *
 * const registry: TCachePolicyConfig = {
 *   clientProfiles: {
 *     // Query field-level policy (merge for infinite scroll, etc.)
 *     fieldPolicy: {
 *       keyArgs: ['filters', 'order'],
 *       merge(existing = { results: [], totalCount: 0 }, incoming, { args }) {
 *         const offset = args?.pagination?.offset ?? 0;
 *         const merged = existing.results ? existing.results.slice(0) : [];
 *         for (let i = 0; i < (incoming.results?.length ?? 0); i++) {
 *           merged[offset + i] = incoming.results![i];
 *         }
 *         return { ...incoming, results: merged };
 *       },
 *     },
 *     // Attach an entity typename and keyFields for normalization
 *     entityTypename: 'ClientProfile',
 *     keyFields: ['id'], // default, may be omitted
 *   },
 *   somePayloadWrapper: {
 *     entityTypename: 'PayloadWrapper',
 *     keyFields: false, // value object: never normalized
 *   },
 * };
 *
 * // 2. Generate the policies and pass them to Apollo:
 *
 * const cache = new InMemoryCache({
 *   typePolicies: generateCachePolicies(registry),
 * });
 *
 * --------------------------------------------------------------------
 * Behavior
 * --------------------------------------------------------------------
 *
 * - Query field policies (`fieldPolicy`) are attached under `Query.fields`.
 * - Each `entityTypename` entry adds a `TypePolicy` with its chosen keyFields:
 *   - `['id']` (default) → standard normalization on `id`.
 *   - `['a','b']` → composite key normalization.
 *   - `false` → value object, never normalized as entity.
 * - If multiple registry entries target the same `entityTypename` but request
 *   different `keyFields`, a warning is logged and the first policy wins.
 *
 * --------------------------------------------------------------------
 * Arguments
 * --------------------------------------------------------------------
 *
 * @param registry   A mapping of query field names to config objects:
 *                   {
 *                     fieldPolicy?: FieldPolicy;
 *                     entityTypename?: string;
 *                     keyFields?: string[] | false;
 *                   }
 *
 * @returns Apollo `TypePolicies` object to pass to `InMemoryCache`.
 */

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
