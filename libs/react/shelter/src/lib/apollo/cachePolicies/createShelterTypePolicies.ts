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
        const urlKey = toUrlKeyFieldValue(obj['url']);

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
  };
}
