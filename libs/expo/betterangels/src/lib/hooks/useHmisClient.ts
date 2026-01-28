import type { HmisCurrentUser } from '@monorepo/expo/shared/clients';
import { createHmisClient } from '@monorepo/expo/shared/clients';
import { useCallback, useMemo } from 'react';

/**
 * React hook for direct HMIS REST API access
 *
 * Use this for HMIS-specific endpoints not exposed through GraphQL backend.
 * For operations like createNote, updateNote, etc., continue using GraphQL mutations.
 *
 * @example
 * ```tsx
 * const { getCurrentUser, hmisClient } = useHmisClient();
 *
 * // Get HMIS current user profile with default fields
 * const user = await getCurrentUser();
 * console.log(user.first_name, user.currentAgency.name);
 *
 * // Get user with custom fields
 * const minimalUser = await getCurrentUser(['id', 'first_name', 'last_name']);
 *
 * // Custom HMIS endpoint
 * const data = await hmisClient.get('/some-hmis-endpoint', {
 *   fields: 'id,name,other_field'
 * });
 * ```
 */
export const useHmisClient = () => {
  // Create HMIS client
  const hmisClient = useMemo(() => createHmisClient(), []);

  /**
   * Get current HMIS user profile with agency and navigation settings
   *
   * @param fields - Array of field names to fetch. If not provided, uses comprehensive default.
   */
  const getCurrentUser = useCallback(
    (fields?: string[]): Promise<HmisCurrentUser> => {
      const defaultFields = [
        'id',
        'profile.has_image',
        'first_name',
        'last_name',
        'isAdmin',
        'currentAgency.id',
        'currentAgency.name',
        'currentAgency.coc',
        'currentAgency.navigationProfile.*',
        'currentAgency.navigationProfile.profileResources.sort',
        'currentAgency.navigationProfile.profileResources.resource.*',
        'currentAgency.currentSetting.id',
        'currentAgency.currentSetting.coc',
        'currentAgency.currentSetting.limit_suggestions',
        'currentAgency.geolocation.longitude',
        'currentAgency.geolocation.latitude',
        'screenId',
        'canShowOutreach',
        'isHideOnTheCustomerPortalAllowed',
        'activeMenuAgencies.agency.id',
        'activeMenuAgencies.agency.name',
        'timeZone.*',
      ];

      const fieldsParam = (fields && fields.length ? fields : defaultFields)
        .filter(Boolean)
        .join(',');

      return hmisClient.get('/current-user', {
        fields: fieldsParam,
      });
    },
    [hmisClient]
  );

  return {
    hmisClient,
    getCurrentUser,
  };
};
