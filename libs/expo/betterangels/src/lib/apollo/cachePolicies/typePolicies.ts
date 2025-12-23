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
 * • Fixing normalization for auxiliary types (e.g. images, metadata, value objects)
 *
 * Example: `DjangoImageType`
 * • Cannot safely use `url` as a cache key because it includes volatile query params
 * • Uses `name` as a stable identity instead
 *
 * Why we define a type policy for DjangoImageType?
 * DjangoImageType is returned by multiple queries (e.g. ClientProfile, Interactions)
 * and does not include a stable `id`. Without a type policy, Apollo treats each
 * occurrence as a new inline object, which can cause parent records to appear
 * changed and trigger unnecessary refetches.
 * ---------------------------------------------------------------------------
 * Rule of Thumb
 * ---------------------------------------------------------------------------
 * • If the type is the *root item* of a paginated query → queryTypePolicies
 * • If the type is a *nested/helper/value type* → extraTypePolicies
 */

import { TypePolicies } from '@apollo/client';
import { generateCachePolicies } from '@monorepo/apollo';
import { cachePolicyRegistry } from './cachePolicyRegistry';

const extraTypePolicies: TypePolicies = {
  DjangoImageType: {
    keyFields: ['name'],
  },
  DjangoFileType: {
    keyFields: ['name'],
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

export const baApolloTypePolicies = {
  ...queryTypePolicies,
  ...extraTypePolicies,
};
