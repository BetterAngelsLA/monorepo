// ActiveOrgProvider, useActiveOrg, and ActiveOrgContext now live in the shared
// @monorepo/ba-platform lib. This barrel re-exports them along with app-specific
// types that other modules (e.g. UserProvider) depend on.
export { ActiveOrgProvider, useActiveOrg } from '@monorepo/ba-platform';

// App-specific types — kept here because they are derived from this app's
// GraphQL generated types.
export type { PermissionEnum, TOrganizationWithPermissions } from './types';
