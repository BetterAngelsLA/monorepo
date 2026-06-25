// ActiveOrgProvider and useActiveOrg now live in the shared
// @monorepo/ba-platform lib. Re-export them for consumers that
// still import from this app's activeOrg barrel.
export { ActiveOrgProvider, useActiveOrg } from '@monorepo/ba-platform';
