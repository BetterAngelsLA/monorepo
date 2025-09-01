import {
  TCachePoliyConfig,
  generateQueryFieldPolicy,
} from '@monorepo/expo/shared/clients';

export const cachePolicyRegistry: TCachePoliyConfig = {
  clientProfiles: {
    entityTypename: 'ClientProfileType',
    fieldPolicy: generateQueryFieldPolicy({
      keyArgs: ['filters', 'order'], // exludes pagination so results can be merged
    }),
  },
  interactionAuthors: {
    entityTypename: 'InteractionAuthorType',
    fieldPolicy: generateQueryFieldPolicy({
      keyArgs: ['filters', 'order'], // exludes pagination so results can be merged
    }),
  },
};
