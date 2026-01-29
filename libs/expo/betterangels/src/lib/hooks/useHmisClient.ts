import type {
  AllowedFileType,
  ClientFileUploadResponse,
  ClientFilesListParams,
  ClientFilesResponse,
  FileCategoriesResponse,
  FileNamesListParams,
  FileNamesResponse,
  HmisCurrentUser,
} from '@monorepo/expo/shared/clients';
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
 * const { getCurrentUser, uploadClientFile, hmisClient } = useHmisClient();
 *
 * // Get HMIS current user profile with default fields
 * const user = await getCurrentUser();
 * console.log(user.first_name, user.currentAgency.name);
 *
 * // Get user with custom fields
 * const minimalUser = await getCurrentUser(['id', 'first_name', 'last_name']);
 *
 * // Upload a client file
 * const result = await uploadClientFile(
 *   '68998C256',
 *   { content: base64String, name: 'document.pdf', mimeType: 'application/pdf' },
 *   12,
 *   89
 * );
 *
 * // Custom HMIS endpoint
 * const data = await hmisClient.get('/some-hmis-endpoint', {
 *   fields: 'id,name,other_field'
 * });
 * ```
 */
export const useHmisClient = () => {
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

  /**
   * Upload a file for a client
   *
   * @param clientId - Client ID (internal numeric or external string like '68998C256')
   * @param file - File object with base64 content, name, and mimeType
   * @param categoryId - File category ID in HMIS
   * @param fileNameId - File name ID from HMIS
   * @param isPrivate - Whether the file should be private (optional, defaults to null)
   * @returns Upload response with file metadata
   */
  const uploadClientFile = useCallback(
    (
      clientId: string | number,
      file: {
        content: string;
        name: string;
        mimeType: AllowedFileType;
      },
      categoryId: number,
      fileNameId: number,
      isPrivate?: boolean | null
    ): Promise<ClientFileUploadResponse> => {
      return hmisClient.uploadClientFile(
        clientId,
        file,
        categoryId,
        fileNameId,
        isPrivate
      );
    },
    [hmisClient]
  );

  /**
   * Get available file categories for uploads
   *
   * @returns Array of available file categories
   */

  /**
   * List files for a specific client
   *
   * @param clientId - Client ID
   * @param params - Query parameters for filtering, sorting, pagination
   * @returns Paginated list of client files
   */
  const getClientFiles = useCallback(
    (
      clientId: string | number,
      params?: ClientFilesListParams
    ): Promise<ClientFilesResponse> => {
      return hmisClient.getClientFiles(clientId, params);
    },
    [hmisClient]
  );
  const getFileCategories = useCallback((): Promise<FileCategoriesResponse> => {
    return hmisClient.getFileCategories();
  }, [hmisClient]);

  const getFileNames = useCallback(
    (params?: FileNamesListParams): Promise<FileNamesResponse> => {
      return hmisClient.getFileNames(params);
    },
    [hmisClient]
  );

  /**
   * Update a client file's metadata (category and file name)
   *
   * Optionally can re-upload the file content. If file is omitted, only
   * metadata is updated.
   *
   * @param clientId - Client ID
   * @param fileId - File ID to update
   * @param categoryId - New category ID
   * @param fileNameId - New file name ID
   * @param file - Optional file object {content, name, mimeType}
   * @param isPrivate - Optional private flag
   */
  const updateClientFile = useCallback(
    (
      clientId: string | number,
      fileId: number,
      categoryId: number,
      fileNameId: number,
      file?: { content: string; name: string; mimeType: string } | null,
      isPrivate?: boolean | null
    ): Promise<ClientFileUploadResponse> => {
      return hmisClient.updateClientFile(
        clientId,
        fileId,
        categoryId,
        fileNameId,
        file,
        isPrivate
      );
    },
    [hmisClient]
  );

  /**
   * Delete a client file
   *
   * @param clientId - Client ID
   * @param fileId - File ID to delete
   */
  const deleteClientFile = useCallback(
    (clientId: string | number, fileId: string | number): Promise<void> => {
      return hmisClient.deleteClientFile(clientId, fileId);
    },
    [hmisClient]
  );

  return {
    hmisClient,
    getCurrentUser,
    uploadClientFile,
    getFileCategories,
    getFileNames,
    getClientFiles,
    updateClientFile,
    deleteClientFile,
  };
};
