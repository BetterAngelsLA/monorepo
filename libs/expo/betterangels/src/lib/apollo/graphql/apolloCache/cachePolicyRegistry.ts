import {
  TCachePolicyConfig,
  generateQueryFieldPolicy,
} from '@monorepo/expo/shared/clients';

export const cachePolicyRegistry: TCachePolicyConfig = {
  clientProfiles: {
    entityTypename: 'ClientProfileType',
    fieldPolicy: generateQueryFieldPolicy({
      // exclude pagination so results can be merged by the merge fn
      keyArgs: ['filters', 'order'],
    }),
  },
  interactionAuthors: {
    entityTypename: 'InteractionAuthorType',
    fieldPolicy: generateQueryFieldPolicy({
      // exclude pagination so results can be merged by the merge fn
      keyArgs: ['filters', 'order'],
    }),
  },
};
