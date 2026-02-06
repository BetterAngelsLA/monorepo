import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  bodyInterceptor,
  composeFetchInterceptors,
  HMIS_API_URL_STORAGE_KEY,
  hmisInterceptor,
  includeCredentialsInterceptor,
  userAgentInterceptor,
} from '../common/interceptors';
import { HmisError, HmisInvalidFileTypeError } from './hmisError';
import {
  ALLOWED_FILE_TYPES,
  AllowedFileType,
  ClientFilesListParams,
  ClientFilesResponse,
  ClientFileUploadRequest,
  ClientFileUploadResponse,
  FileCategoriesResponse,
  FileNamesResponse,
  HmisHttpQueryParams,
  HmisRequestOptions,
} from './hmisTypes';

export const HMIS_REST_API_MAX_PER_PAGE = 50;

/**
 * HMIS REST API Client
 *
 * Handles direct access to HMIS REST endpoints from React Native.
 * Uses composable interceptors for auth, cookies, and headers.
 */
class HmisClient {
  private composedFetch: (
    input: RequestInfo | URL,
    init?: RequestInit
  ) => Promise<Response>;

  constructor() {
    // Compose fetch with interceptors for HMIS direct API calls
    this.composedFetch = composeFetchInterceptors(
      userAgentInterceptor,
      hmisInterceptor,
      bodyInterceptor,
      includeCredentialsInterceptor
    );
  }
  /**
   * Get HMIS API base URL from stored value
   */
  private async getBaseUrl(): Promise<string> {
    const hmisApiUrl = await AsyncStorage.getItem(HMIS_API_URL_STORAGE_KEY);
    if (!hmisApiUrl) {
      throw new HmisError(
        'HMIS API URL not found. Please log in to HMIS first.',
        401
      );
    }
    return hmisApiUrl;
  }

  private async handleError(response: Response): Promise<never> {
    const contentType = response.headers.get('content-type');
    const data = await (contentType?.includes('application/json')
      ? response.json().catch(() => null)
      : response.text().catch(() => null));

    switch (response.status) {
      case 401:
        throw new HmisError('Unauthorized - please log in', 401, data);
      case 403:
        throw new HmisError('Forbidden - insufficient permissions', 403, data);
      case 404:
        throw new HmisError('Resource not found', 404, data);
      case 429: {
        throw new HmisError('Too Many Requests', 429, data);
      }
      case 422: {
        const validationData = data as { messages?: Record<string, string> };
        if (validationData?.messages) {
          const errors = Object.entries(validationData.messages)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          throw new HmisError(`Validation errors: ${errors}`, 422, data);
        }
        throw new HmisError('Validation error', 422, data);
      }
      default:
        throw new HmisError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        );
    }
  }

  /**
   * Make a request to HMIS REST API
   */
  async request<T = unknown>(
    path: string,
    options: HmisRequestOptions = {}
  ): Promise<T> {
    const baseUrl = await this.getBaseUrl();

    // Build URL with query params
    const url = new URL(path, baseUrl);
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }

        url.searchParams.append(key, String(value));
      });
    }

    const fetchOptions: RequestInit = {
      method: options.method,
      headers: options.headers,
      body: options.body as BodyInit | undefined,
    };

    const response = await this.composedFetch(url.toString(), fetchOptions);

    // Handle errors
    if (!response.ok) {
      await this.handleError(response);
    }

    // Parse response - try JSON first regardless of Content-Type
    // Some HMIS endpoints return JSON with incorrect/missing Content-Type headers
    // Some endpoints also return double-encoded JSON strings
    const text = await response.text();

    if (!text) return text as unknown as T;

    try {
      const parsed = JSON.parse(text);

      // Handle double-encoded JSON: if parsed result is a string, try parsing again
      if (typeof parsed === 'string') {
        try {
          return JSON.parse(parsed);
        } catch {
          // Not double-encoded, return the string
          return parsed as unknown as T;
        }
      }

      return parsed;
    } catch {
      return text as unknown as T; // Not JSON, return raw text
    }
  }

  get<T = unknown>(path: string, params?: HmisHttpQueryParams): Promise<T> {
    return this.request<T>(path, { method: 'GET', params });
  }

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body });
  }

  put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body });
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /**
   * Upload multipart/form-data (e.g., for photo uploads)
   * Does NOT set Content-Type header (browser sets it with boundary automatically)
   * Does NOT JSON.stringify the body (FormData is sent as-is)
   */
  async postMultipart<T = unknown>(
    path: string,
    formData: FormData
  ): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Upload a file for a client
   *
   * @param clientId - The client ID (can be internal ID or external client ID string)
   * @param file - File data object with base64 content
   * @param file.content - Base64 encoded file content
   * @param file.name - File name with extension
   * @param file.mimeType - MIME type of the file (must be in allowed types)
   * @param categoryId - File category ID
   * @param fileNameId - File name ID from HMIS
   * @param isPrivate - Whether the file should be private (optional)
   * @returns Promise with upload response
   * @throws HmisError if file type is not allowed or upload fails
   *
   * @example
   * ```typescript
   * const result = await hmisClient.uploadClientFile(
   *   '68998C256',
   *   {
   *     content: 'base64encodedcontent...',
   *     name: 'document.pdf',
   *     mimeType: 'application/pdf'
   *   },
   *   12, // category ID
   *   89  // file name ID
   * );
   * ```
   */
  async uploadClientFile(
    clientId: string | number,
    file: {
      content: string;
      name: string;
      mimeType: AllowedFileType;
    },
    categoryId: number,
    fileNameId: number,
    isPrivate: boolean | null = null
  ): Promise<ClientFileUploadResponse> {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.mimeType)) {
      throw new HmisInvalidFileTypeError('Invalid file type', 400, {
        received: file.mimeType,
        allowed: ALLOWED_FILE_TYPES,
      });
    }

    // Build data URI with proper format
    const dataUri = `data:${file.mimeType};base64,${file.content}`;

    // Build request payload matching API expectations
    const payload: ClientFileUploadRequest = {
      clientFile: {
        ref_category: categoryId,
        ref_file_name: fileNameId,
        private: isPrivate,
      },
      base64_file_content: dataUri,
      file_name: file.name,
    };

    // Make POST request to client-files endpoint
    return this.post<ClientFileUploadResponse>(
      `/clients/${clientId}/client-files`,
      payload
    );
  }

  /**
   * Update a client file's metadata (category and file name)
   *
   * Updates an existing client file record to change its category and file name
   * assignments. Optionally, you can re-upload the file content by passing the
   * file object. If omitted, only the metadata is updated.
   *
   * @param clientId - The client ID
   * @param fileId - The file ID to update
   * @param categoryId - New category ID
   * @param fileNameId - New file name ID
   * @param file - Optional file object {content, name, mimeType}. If provided, updates the file content
   * @param isPrivate - Optional private flag
   * @returns Promise with updated file response
   * @throws HmisError if the request fails
   *
   * @example
   * ```typescript
   * // Update only metadata
   * const result = await hmisClient.updateClientFile(
   *   '68998C256',
   *   42,
   *   12, // new category ID
   *   89  // new file name ID
   * );
   *
   * // Update metadata and re-upload file content
   * const resultWithFile = await hmisClient.updateClientFile(
   *   '68998C256',
   *   42,
   *   12,
   *   89,
   *   {
   *     content: base64String,
   *     name: 'updated-document.txt',
   *     mimeType: 'text/plain'
   *   }
   * );
   * ```
   */
  async updateClientFile(
    clientId: string | number,
    fileId: number,
    categoryId: number,
    fileNameId: number,
    file?: { content: string; name: string; mimeType: string } | null,
    isPrivate: boolean | null = null
  ): Promise<ClientFileUploadResponse> {
    const clientFile: Record<string, unknown> = {
      id: fileId,
      ref_category: categoryId,
      ref_file_name: fileNameId,
      private: isPrivate,
    };

    // If file content is provided, include it in the payload
    if (file) {
      clientFile['file'] = {
        name: file.name,
        mimeType: file.mimeType,
        uploadedFile: file.content,
      };
    }

    const payload = { clientFile };

    return this.post<ClientFileUploadResponse>(
      `/clients/${clientId}/client-files/${fileId}`,
      payload
    );
  }

  /**
   * Get available file categories for uploads
   *
   * Fetches the list of file categories that can be assigned when uploading
   * files for a client.
   *
   * @returns Promise with paginated file categories response
   * @throws HmisError if the request fails
   *
   * @example
   * ```typescript
   * const response = await hmisClient.getFileCategories();
   * response.items.forEach(cat => {
   *   console.log(`${cat.id}: ${cat.name}`);
   * });
   * ```
   */
  async getFileCategories(
    params?: HmisHttpQueryParams
  ): Promise<FileCategoriesResponse> {
    return this.get<FileCategoriesResponse>('/client-file-categories', params);
  }

  /**
   * Get available file names for uploads
   *
   * Fetches the list of file names that can be assigned when uploading
   * files for a client.
   *
   * @param params - Query parameters for filtering, sorting, and pagination
   * @returns Promise with paginated file names response
   * @throws HmisError if the request fails
   *
   * @example
   * ```typescript
   * const response = await hmisClient.getFileNames({
   *   page: 1,
   *   per_page: 50,
   *   sort: 'name'
   * });
   * response.items.forEach(name => {
   *   console.log(`${name.id}: ${name.name}`);
   * });
   * ```
   */
  async getFileNames(params?: HmisHttpQueryParams): Promise<FileNamesResponse> {
    return this.get<FileNamesResponse>('/client-file-names', params);
  }

  /**
   * List files for a specific client
   *
   * Fetches paginated list of files for a client with optional filtering,
   * sorting, and field expansion.
   *
   * @param clientId - The client ID
   * @param params - Query parameters for filtering, sorting, and pagination
   * @returns Promise with paginated list of client files
   * @throws HmisError if the request fails
   *
   * @example
   * ```typescript
   * const files = await hmisClient.getClientFiles('68998C256', {
   *   sort: '-file_date',
   *   page: 1,
   *   per_page: 10,
   *   expand: 'category,file,creator'
   * });
   * ```
   */
  async getClientFiles(
    clientId: string | number,
    params?: ClientFilesListParams
  ): Promise<ClientFilesResponse> {
    const queryParams: Record<string, string> = {};

    if (params?.sort) queryParams['sort'] = params.sort;
    if (params?.expand) queryParams['expand'] = params.expand;
    if (params?.is_file !== undefined)
      queryParams['is_file'] = String(params.is_file);
    if (params?.deleted !== undefined)
      queryParams['deleted'] = String(params.deleted);
    if (params?.page !== undefined) queryParams['page'] = String(params.page);
    if (params?.per_page !== undefined)
      queryParams['per_page'] = String(params.per_page);
    if (params?.fields) queryParams['fields'] = params.fields;

    return this.get<ClientFilesResponse>(
      `/clients/${clientId}/client-files`,
      queryParams
    );
  }

  /**
   * Delete a client file
   *
   * Permanently removes a file record from the client's file list.
   *
   * @param clientId - The client ID
   * @param fileId - The file ID to delete
   * @throws HmisError if the request fails
   *
   * @example
   * ```typescript
   * await hmisClient.deleteClientFile('68998C256', 37);
   * ```
   */
  async deleteClientFile(
    clientId: string | number,
    fileId: string | number
  ): Promise<void> {
    await this.delete(`/clients/${clientId}/client-files/${fileId}`);
  }
}

// Factory function to create HmisClient
export const createHmisClient = () => new HmisClient();

export const getHmisFileUrls = (
  baseUrl: string,
  clientId: string | number,
  fileId: string | number
) => {
  return {
    thumbnail: `${baseUrl}/clients/${clientId}/client-files/${fileId}/thumb`,
    content: `${baseUrl}/clients/${clientId}/client-files/${fileId}/content`,
  };
};

export { HmisClient };
