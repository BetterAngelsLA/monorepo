/**
 * cachePolicyRegistry
 *
 * Central registry of Apollo cache policies. Passed into
 * `generateCachePolicies` to produce a `typePolicies` object
 * for `InMemoryCache`.
 *
 * --------------------------------------------------------------------
 * TCachePolicyConfig (mental model)
 * --------------------------------------------------------------------
 *
 * type TCachePolicyConfig = Record<
 *   string,
 *   {
 *     fieldPolicy?: FieldPolicy;
 *     entityTypename?: string;
 *     keyFields?: ReadonlyArray<string> | false;
 *   }
 * >;
 *
 * - fieldPolicy:   Query field policy (merge, keyArgs, etc.)
 * - entityTypename: Entity typename to attach keyFields policy
 * - keyFields:
 *     • omitted → defaults to ['id']
 *     • array   → composite key (['orgId','slug'])
 *     • false   → treat as value object (never normalized)
 *
 * --------------------------------------------------------------------
 * Basic Scenario
 * --------------------------------------------------------------------
 *
 * import { TCachePolicyConfig, generateFieldPolicy } from '@monorepo/apollo';
 *
 * export const cachePolicyRegistry: TCachePolicyConfig = {
 *   tasks: {
 *     entityTypename: 'TaskType',
 *     fieldPolicy: generateFieldPolicy({
 *       // exclude pagination so pages can merge
 *       keyArgs: ['filters', 'order'],
 *     }),
 *     // keyFields omitted → defaults to ['id']
 *   },
 * };
 *
 * const cache = new InMemoryCache({
 *   typePolicies: generateCachePolicies(cachePolicyRegistry),
 * });
 *
 * --------------------------------------------------------------------
 * Advanced Scenario
 * --------------------------------------------------------------------
 *
 * export const cachePolicyRegistry: TCachePolicyConfig = {
 *   // 1) Paginated tasks list with infinite scroll
 *   tasks: {
 *     entityTypename: 'TaskType',
 *     fieldPolicy: generateFieldPolicy({
 *       keyArgs: ['filters', 'order'], // exclude pagination
 *     }),
 *   },
 *
 *   // 2) Another list with different dimensions
 *   clientProfiles: {
 *     entityTypename: 'ClientProfile',
 *     fieldPolicy: generateFieldPolicy({
 *       keyArgs: ['filters', 'order', 'region'],
 *     }),
 *   },
 *
 *   // 3) Value object payload wrapper (never normalized)
 *   createTaskPayload: {
 *     entityTypename: 'CreateTaskPayload',
 *     keyFields: false,
 *   },
 *
 *   // 4) Composite key entity
 *   project: {
 *     entityTypename: 'Project',
 *     keyFields: ['orgId', 'slug'],
 *   },
 *
 *   // 5) Field with custom merge options
 *   activities: {
 *     entityTypename: 'Activity',
 *     fieldPolicy: generateFieldPolicy({
 *       keyArgs: ['filters'],
 *       // mergeOpts can be passed here to override defaults
 *     }),
 *   },
 * };
 *
 * const cache = new InMemoryCache({
 *   typePolicies: generateCachePolicies(cachePolicyRegistry),
 * });
 *
 * --------------------------------------------------------------------
 * Notes
 * --------------------------------------------------------------------
 *
 * - keyArgs on Query field controls list partitioning.
 *   Omit pagination so pages merge; include filters/order/etc.
 *
 * - keyFields on entity type controls normalization.
 *   Omit → ['id'], Array → composite key, false → value object.
 *
 * - Conflicts: If multiple entries define different keyFields for the
 *   same entityTypename, the first wins and a warning is logged.
 *
 * - Merge behavior: generateFieldPolicy delegates to generateMergeFn.
 *   By default, supports offset/limit infinite scrolling.
 *   Pass mergeOpts to customize merging if needed.
 */

import { TCachePolicyConfig, generateFieldPolicy } from '@monorepo/apollo';

export const cachePolicyRegistry: TCachePolicyConfig = {
  tasks: {
    entityTypename: 'TaskType',
    fieldPolicy: generateFieldPolicy({
      keyArgs: ['filters', 'order'],
    }),
  },
  clientProfiles: {
    entityTypename: 'ClientProfileType',
    fieldPolicy: generateFieldPolicy({
      keyArgs: ['filters', 'order'],
    }),
  },
  interactionAuthors: {
    entityTypename: 'InteractionAuthorType',
    fieldPolicy: generateFieldPolicy({
      keyArgs: ['filters', 'order'],
    }),
  },
  caseworkerOrganizations: {
    entityTypename: 'OrganizationType',
    fieldPolicy: generateFieldPolicy({
      keyArgs: ['filters', 'order'],
    }),
  },
};
