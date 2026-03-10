import type {
  ClientFileUploadResponse,
  ClientFilesListParams,
  ClientFilesResponse,
  ClientPhotoUploadResponse,
  CurrentUserHmis,
  FileCategoriesResponse,
  FileNamesResponse,
  HttpQueryParamsHmis,
  UploadClientFileParams,
} from '@monorepo/expo/shared/clients';
import { createClientHmis } from '@monorepo/expo/shared/clients';
import { useCallback, useMemo } from 'react';

/**
 * React hook for direct HMIS REST API access
 *
 * Use this for HMIS-specific endpoints not exposed through GraphQL backend.
 * For operations like createNote, updateNote, etc., continue using GraphQL mutations.
 *
 * @example
 * ```tsx
 * const { getCurrentUser, uploadClientFile, uploadClientPhoto, clientHmis } = useClientHmis();
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
 * // Upload client photo
 * const formData = new FormData();
 * formData.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' });
 * await uploadClientPhoto('68998C256', formData);
 *
 * // Custom HMIS endpoint
 * const data = await hmisClient.get('/some-hmis-endpoint', {
 *   fields: 'id,name,other_field'
 * });
 * ```
 */
export const useClientHmis = () => {
  const clientHmis = useMemo(() => createClientHmis(), []);

  /**
   * Get current HMIS user profile with agency and navigation settings
   *
   * @param fields - Array of field names to fetch. If not provided, uses comprehensive default.
   */
  const getCurrentUser = useCallback(
    (fields?: string[]): Promise<CurrentUserHmis> => {
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

      return clientHmis.get('/current-user', {
        fields: fieldsParam,
      });
    },
    [clientHmis]
  );

  /**
   * Upload a file for a client.
   *
   * Accepts {@link UploadClientFileParams} and forwards the call to
   * `clientHmis.uploadClientFile`.
   */
  const uploadClientFile = useCallback(
    (props: UploadClientFileParams): Promise<ClientFileUploadResponse> => {
      return clientHmis.uploadClientFile(props);
    },
    [clientHmis]
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
      return clientHmis.getClientFiles(clientId, params);
    },
    [clientHmis]
  );
  const getFileCategories = useCallback(
    (params?: HttpQueryParamsHmis): Promise<FileCategoriesResponse> => {
      return clientHmis.getFileCategories(params);
    },
    [clientHmis]
  );

  const getFileNames = useCallback(
    (params?: HttpQueryParamsHmis): Promise<FileNamesResponse> => {
      return clientHmis.getFileNames(params);
    },
    [clientHmis]
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
      return clientHmis.updateClientFile(
        clientId,
        fileId,
        categoryId,
        fileNameId,
        file,
        isPrivate
      );
    },
    [clientHmis]
  );

  /**
   * Delete a client file
   *
   * @param clientId - Client ID
   * @param fileId - File ID to delete
   */
  const deleteClientFile = useCallback(
    (clientId: string | number, fileId: string | number): Promise<void> => {
      return clientHmis.deleteClientFile(clientId, fileId);
    },
    [clientHmis]
  );

  /**
   * Upload client photo
   *
   * POST /clients/{id}/photo/upload with multipart/form-data.
   *
   * @param clientId - Client ID
   * @param formData - FormData containing the photo file (e.g. from image picker)
   * @returns Promise with upload response
   */
  const uploadClientPhoto = useCallback(
    (
      clientId: string | number,
      formData: FormData
    ): Promise<ClientPhotoUploadResponse> => {
      return clientHmis.uploadClientPhoto(clientId, formData);
    },
    [clientHmis]
  );

  return {
    clientHmis,
    getCurrentUser,
    uploadClientFile,
    uploadClientPhoto,
    getFileCategories,
    getFileNames,
    getClientFiles,
    updateClientFile,
    deleteClientFile,
  };
};
