import { FieldPolicy, TypePolicies, TypePolicy } from '@apollo/client';
import { TCachePoliyConfig } from '../types';

export function generateCachePolicies(
  policyMap: TCachePoliyConfig
): TypePolicies {
  // Collect Query field policies
  const queryFields: Record<string, FieldPolicy> = {};

  // Collect per-typename policies (entity config)
  const modelPolicies: Record<string, TypePolicy> = {};

  for (const [fieldName, entry] of Object.entries(policyMap)) {
    // 1) Query.<fieldName>
    queryFields[fieldName] = entry.fieldPolicy;

    // 2) Entity typename config (keyFields) — add only once per typename
    const typename = entry.modelName;

    if (!modelPolicies[typename]) {
      const typePolicy: TypePolicy = {};
      if (entry.modelPK) {
        // Only set if you explicitly provided a PK (e.g., 'id' or a custom/composite in future)
        typePolicy.keyFields = [entry.modelPK];
      }
      modelPolicies[typename] = typePolicy;
    }
  }

  // Assemble final TypePolicies
  const typePolicies: TypePolicies = {
    // entity policies
    ...modelPolicies,

    // root Query field policies
    Query: {
      fields: queryFields,
    },
  };

  return typePolicies;
}
