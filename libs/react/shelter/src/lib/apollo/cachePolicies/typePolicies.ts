import { StoreObject, TypePolicies } from '@apollo/client';
import { generateCachePolicies } from '@monorepo/apollo';
import { cachePolicyRegistry } from './cachePolicyRegistry';
import { toUrlKeyFieldValue } from './utils/toUrlKeyFieldValue';

const isDevEnv = import.meta.env.DEV;

const extraTypePolicies: TypePolicies = {
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

const queryTypePolicies = generateCachePolicies(cachePolicyRegistry);

// TODO: add merge safety to avoid defining policy in both places
export const shelterApolloTypePolicies = {
  ...queryTypePolicies,
  ...extraTypePolicies,
};
