import {
  FieldPolicy,
  InMemoryCache,
  TypePolicies,
  TypePolicy,
} from '@apollo/client';
import { TYPE_POLICIES_SYM } from '../constants';
import { TCacheWithPolicies } from '../types';

export function getTypePoliciesFromCache(cache: InMemoryCache): TypePolicies {
  if (!(TYPE_POLICIES_SYM in cache)) {
    throw new Error(
      `Active cache has no attached typePolicies. To validate cache policies, must attach them to cacheStore via TYPE_POLICIES_SYM: cache[${String(
        TYPE_POLICIES_SYM
      )}] = typePolicies`
    );
  }

  return (cache as unknown as TCacheWithPolicies)[TYPE_POLICIES_SYM];
}

export function assertQueryFieldHasMerge(
  cache: InMemoryCache,
  fieldName: string,
  silenceError?: boolean
) {
  try {
    const policies = getTypePoliciesFromCache(cache);

    const typePolicy = policies['Query'] as TypePolicy | undefined;

    const fields = (typePolicy?.fields ?? {}) as Record<
      string,
      FieldPolicy | undefined
    >;

    const fieldPolicy = fields[fieldName];

    if (!fieldPolicy || typeof fieldPolicy.merge !== 'function') {
      throw new Error(
        `[Apollo] Missing merge for [Query.${fieldName}] Add keyArgs with merge function in typePolicies.`
      );
    }
  } catch (e) {
    const err = toError(e);

    if (silenceError) {
      console.warn(err);

      return;
    }

    throw err;
  }
}

function toError(value: any): Error {
  if (value instanceof Error) {
    return value;
  }

  return new Error(String(value));
}
