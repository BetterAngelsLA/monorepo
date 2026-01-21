/**
 * HMIS REST API TypeScript types
 */

export interface HmisRequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string>;
  body?: any;
}

export class HmisError extends Error {
  constructor(message: string, public status: number, public data?: any) {
    super(message);
    this.name = 'HmisError';
  }
}

/**
 * HMIS API Response Types
 * These match the shapes returned by the HMIS REST API
 */

export interface HmisCurrentUser {
  id: number;
  first_name: string;
  last_name: string;
  isAdmin: number;
  screenId: number;
  canShowOutreach: boolean;
  isHideOnTheCustomerPortalAllowed: boolean;
  profile: {
    has_image: string | null;
  };
  currentAgency: {
    id: number;
    name: string;
    coc: string;
    navigationProfile: {
      id: number;
      name: string;
      profileResources: Array<{
        sort: number;
        resource: {
          id: number;
          name: string;
          display_name: string;
          in_top_menu: number;
        };
      }>;
    };
    currentSetting: {
      id: number;
      coc: string | null;
      limit_suggestions: number;
    };
    geolocation: {
      latitude: number;
      longitude: number;
    };
  };
  timeZone: {
    id: number;
    description: string;
    timezone: string;
    sql_timezone: string;
    offset: number;
  };
  activeMenuAgencies: Array<{
    agency: {
      id: number;
      name: string;
    };
  }>;
}

export interface HmisValidationError {
  field: string;
  message: string;
}
