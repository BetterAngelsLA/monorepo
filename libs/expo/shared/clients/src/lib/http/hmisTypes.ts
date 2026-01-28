/**
 * HMIS REST API TypeScript types
 */

export interface HmisRequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string>;
  body?: unknown;
}

export class HmisError extends Error {
  constructor(message: string, public status: number, public data?: unknown) {
    super(message);
    this.name = 'HmisError';
  }
}

/**
 * HMIS API Response Types
 * These are manually created to match the shapes returned by the HMIS REST API
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

/**
 * Allowed MIME types for client file uploads
 */
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/png',
  'image/tiff',
  'image/heic',
  'text/plain',
  'application/msword',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

/**
 * Client file upload request payload
 */
export interface ClientFileUploadRequest {
  clientFile: {
    ref_category: number;
    ref_file_name: number;
    private: boolean | null;
  };
  base64_file_content: string; // Data URI format: "data:mime/type;base64,encodedcontent"
  file_name: string;
}

/**
 * Client file upload response
 */
export interface ClientFileUploadResponse {
  id: number;
  ref_client: number;
  ref_creator: number;
  ref_file: number;
  ref_file_name: number;
  ref_category: number;
  name: string;
  private: boolean | null;
  ref_agency: number;
  added_date: unknown;
  last_updated: unknown;
  ref_user_updated: number;
  deleted: string | null;
  deleted_parent_id: number | null;
  ref_agency_deleted: number | null;
  ref_user_home_agency: number;
  hidden_on_customer_portal: number;
  ref_client_form_template: number | null;
  personalId: number;
  organizationId: number;
  fileId: number;
  categoryId: number;
  fileNameId: number;
  otherName: string;
  dateCreated: unknown;
  dateUpdated: unknown;
  creator: unknown;
  clientId: string;
}
/**
 * File category information
 */
export interface FileCategory {
  id: number;
  name: string;
  status: number;
  description?: string;
}

/**
 * File name item
 */
export interface FileName {
  id: number;
  name: string;
  ref_category: number;
  status: number;
}

/**
 * File names list response
 */
export interface FileNamesResponse {
  items: FileName[];
  _meta: {
    current_page: number;
    per_page: number;
    page_count: number;
    total_count: number;
  };
  _links: {
    self: { href: string };
    first: { href: string };
    last: { href: string };
    next?: { href: string };
  };
}

/**
 * File categories list response
 */
export interface FileCategoriesResponse {
  items: FileCategory[];
  _meta: {
    current_page: number;
    per_page: number;
    total?: number;
  };
}

/**
 * Client file information
 */
export interface ClientFile {
  id: number;
  name: string;
  private: boolean | null;
  ref_category: number;
  ref_file_name: number;
  ref_agency: number;
  is_program_file: number;
  category?: {
    id: number;
    name: string;
    status: number;
  };
  file?: {
    id: number;
    added_date: string;
    filename: string;
    filesize: number;
    encodedPreviewFileContent?: string;
    encodedThumbnailFileContent?: string;
  };
  fileName?: {
    id: number;
    name: string;
  };
  creator?: {
    id: number;
    first_name: string;
    last_name: string;
    fullName: string;
    currentAgency?: {
      id: number;
      name: string;
    };
  };
  agency?: {
    id: number;
    name: string;
  };
  client?: {
    uniqueIdentifier: string;
  };
  clientProgramsFiles?: Array<{
    id: number;
    clientProgram?: {
      program?: {
        id: number;
        name: string;
        added_date: string;
        operatingEndDate?: string;
        agency?: {
          id: number;
          name: string;
        };
      };
    };
  }>;
}

/**
 * Client files list response with pagination
 */
export interface ClientFilesResponse {
  items: ClientFile[];
  _meta: {
    current_page: number;
    per_page: number;
    total?: number;
    page_count?: number;
  };
}

/**
 * Query parameters for listing client files
 */
export interface ClientFilesListParams {
  sort?: string;
  expand?: string;
  is_file?: number;
  deleted?: number;
  page?: number;
  per_page?: number;
  fields?: string;
}
