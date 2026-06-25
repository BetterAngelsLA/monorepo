/**
 * Shared default storage key for active organization ID.
 * Used by ``orgLink`` (Apollo link) and ``useActiveOrgState`` (React hook)
 * so they stay in sync without hard-coding the same string in multiple places.
 */
export const DEFAULT_ORG_STORAGE_KEY = 'betterangels_active_org_id';
