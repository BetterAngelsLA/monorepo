import { StoreObject, TypePolicies } from '@apollo/client';
import { generateCachePolicies } from '@monorepo/apollo';
import { createShelterApolloCachePolicyRegistry } from './cachePolicyRegistry';
import { toUrlKeyFieldValue } from './utils/toUrlKeyFieldValue';

// TODO: add merge safety to avoid defining policy in both places
export function createShelterTypePolicies(isDevEnv: boolean): TypePolicies {
  const cachePolicyRegistry = createShelterApolloCachePolicyRegistry(isDevEnv);

  const queryTypePolicies = generateCachePolicies(cachePolicyRegistry);

  return {
    ...queryTypePolicies,
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
    UserType: {
      keyFields: ['id'],
    },
    AddressType: {
      keyFields: ['id'],
    },
    OrganizationType: {
      keyFields: ['id'],
    },
    AdminShelterType: {
      keyFields: ['id'],
    },
  };
}
