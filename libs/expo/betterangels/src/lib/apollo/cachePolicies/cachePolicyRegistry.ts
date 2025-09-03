import { TCachePolicyConfig, generateFieldPolicy } from '@monorepo/apollo';

export const cachePolicyRegistry: TCachePolicyConfig = {
  clientProfiles: {
    entityTypename: 'ClientProfileType',
    fieldPolicy: generateFieldPolicy({
      // exclude pagination so results can be merged by the merge fn
      keyArgs: ['filters', 'order'],
    }),
  },
  interactionAuthors: {
    entityTypename: 'InteractionAuthorType',
    fieldPolicy: generateFieldPolicy({
      // exclude pagination so results can be merged by the merge fn
      keyArgs: ['filters', 'order'],
    }),
  },
};
