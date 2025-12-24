/**
 * Apollo Type Policies
 *
 * This module composes **all Apollo cache type policies** used by the app.
 *
 * ---------------------------------------------------------------------------
 * queryTypePolicies
 * ---------------------------------------------------------------------------
 * Generated automatically from `cachePolicyRegistry` via `generateCachePolicies`.
 *
 * These policies are **query-centric** and define:
 * • Field policies on `Query` (pagination, keyArgs, merge behavior)
 * • Normalization (`keyFields`) for *list item entities* returned by those queries
 *
 * In short: use `queryTypePolicies` for anything that:
 * • Is returned by a list-style query (tasks, notes, clients, etc.)
 * • Needs pagination-aware merging
 * • Needs cache identity tied to query variables (`filters`, `ordering`, etc.)
 *
 * ---------------------------------------------------------------------------
 * extraTypePolicies
 * ---------------------------------------------------------------------------
 * Manually defined policies for **non-query-owned types**.
 *
 * Use this for:
 * • Nested or leaf types that appear inside other entities
 * • Types that are not the primary result of a list query
 * • Fixing normalization for auxiliary types (e.g. images, files, metadata)
 *
 * ---------------------------------------------------------------------------
 * URL-backed media types (DjangoImageType / DjangoFileType)
 * ---------------------------------------------------------------------------
 * These types do NOT expose a stable `id`, and their `url` field may include
 * volatile query parameters (e.g. signed URLs, expirations).
 *
 * To safely normalize them:
 * • We derive a canonical cache key from `url` by stripping query parameters
 * • If a stable key cannot be computed, we return `false`
 *
 * Returning `false` explicitly tells Apollo:
 * → "Do not normalize this object; treat it as inline data"
 *
 * This avoids:
 * • Cache key collisions
 * • Invariant violations
 * • Accidental cross-entity overwrites
 *
 * Warnings are logged when a key cannot be derived to help detect schema or
 * backend regressions early.
 *
 * ---------------------------------------------------------------------------
 * Rule of Thumb
 * ---------------------------------------------------------------------------
 * • Root items of paginated queries → queryTypePolicies
 * • Nested/helper/value objects → extraTypePolicies
 * • Objects without a guaranteed stable identity → `keyFields: false`
 */

import { StoreObject, TypePolicies } from '@apollo/client';
import { generateCachePolicies } from '@monorepo/apollo';
import { cachePolicyRegistry } from './cachePolicyRegistry';
import { toUrlKeyFieldValue } from './utils/toUrlKeyFieldValue';

const isDevEnv = process.env['NODE_ENV'] !== 'production';

const extraTypePolicies: TypePolicies = {
  DjangoImageType: {
    keyFields: (obj: StoreObject) => {
      const urlKey = toUrlKeyFieldValue(obj.url);

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
      const urlKey = toUrlKeyFieldValue(obj.url);

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
  ClientContactType: {
    keyFields: ['id'],
  },
  ClientDocumentType: {
    keyFields: ['id'],
  },
  HmisProfileType: {
    keyFields: ['id'],
  },
  ClientHouseholdMemberType: {
    keyFields: ['id'],
  },
  PhoneNumberType: {
    keyFields: ['id'],
  },
  UserType: {
    keyFields: ['id'],
  },
  ServiceRequestType: {
    keyFields: ['id'],
  },
  OrganizationServiceType: {
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
export const baApolloTypePolicies = {
  ...queryTypePolicies,
  ...extraTypePolicies,
};
