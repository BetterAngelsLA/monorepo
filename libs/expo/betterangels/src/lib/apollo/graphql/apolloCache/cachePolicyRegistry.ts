import {
  TCachePoliyConfig,
  generateQueryFieldPolicy,
} from '@monorepo/expo/shared/clients';

export const cachePolicyRegistry: TCachePoliyConfig = {
  clientProfiles: {
    modelName: 'ClientProfileType',
    modelPK: 'id',
    fieldPolicy: generateQueryFieldPolicy({
      keyArgs: ['filters', 'order'],
      // mergeOpts should be optional / use default
      mergeOpts: {
        mode: 'wrapper', // should be optional / default
        resultsKey: 'results', // should be optional / default
        totalKey: 'totalCount', // should be optional / default
        pageInfoKey: 'pageInfo', // should be optional / default
      },
    }),
  },
  interactionAuthors: {
    modelName: 'InteractionAuthorType',
    modelPK: 'id',
    fieldPolicy: generateQueryFieldPolicy({
      keyArgs: ['filters', 'order'],
      // mergeOpts should be optional / use default
      mergeOpts: {
        mode: 'wrapper', // should be optional / default
        resultsKey: 'results', // should be optional / default
        totalKey: 'totalCount', // should be optional / default
        pageInfoKey: 'pageInfo', // should be optional / default
      },
    }),
  },
};
