import { StoreObject, TypePolicies } from '@apollo/client';
import { generateCachePolicies } from '@monorepo/apollo';
import { createShelterApolloCachePolicyRegistry } from './cachePolicyRegistry';
import { toUrlKeyFieldValue } from './utils/toUrlKeyFieldValue';

/**
 * Creates the shelter-wide Apollo cache type policies.
 *
 * Only types whose cache key differs from Apollo's default are listed here.
 * Apollo defaults to {@code keyFields: ['id']} for any type with an {@code id}
 * field, so types like {@code UserType}, {@code OrganizationType}, and
 * need no explicit policy.
 *
 * {@code DjangoImageType} and {@code DjangoFileType} use URL-based keys
 * because their {@code id} fields are not stable across requests.
 *
 * @param props.isDevEnv - enables dev-mode warnings for missing key fields.
 * @param props.extraPolicies - additional policies injected by consumers
 *   (e.g. shelter-operator's {@code createOperatorTypePolicies}).
 */
export type CreateShelterTypePoliciesProps = {
  isDevEnv: boolean;
  extraPolicies?: TypePolicies;
};

export function createShelterTypePolicies(
  props: CreateShelterTypePoliciesProps
): TypePolicies {
  const { isDevEnv, extraPolicies } = props;

  const cachePolicyRegistry = createShelterApolloCachePolicyRegistry(isDevEnv);

  const queryTypePolicies = generateCachePolicies(cachePolicyRegistry);

  return {
    ...queryTypePolicies,
    ...extraPolicies,
    DjangoImageType: {
      keyFields: (obj: StoreObject) => {
        // Use `url` when present; otherwise pick the first URL-like string value
        // (e.g. sm/lg aliases). toUrlKeyFieldValue strips query params so the
        // key is stable regardless of which preset was requested.
        const rawUrl =
          obj['url'] ??
          Object.values(obj).find(
            (v) => typeof v === 'string' && v.startsWith('http')
          );

        const urlKey = toUrlKeyFieldValue(rawUrl);

        if (isDevEnv && !urlKey) {
          console.warn(
            `[typePolicies: DjangoImageType] missing url keyField: ${JSON.stringify(
              obj
            )}`
          );
        }

        return urlKey ?? false;
      },
    },
    DjangoFileType: {
      keyFields: (obj: StoreObject) => {
        const urlKey = toUrlKeyFieldValue(obj['url']);

        if (isDevEnv && !urlKey) {
          console.warn(
            `[typePolicies: DjangoFileType] missing url keyField: ${JSON.stringify(
              obj
            )}`
          );
        }

        return urlKey ?? false;
      },
    },
  };
}
