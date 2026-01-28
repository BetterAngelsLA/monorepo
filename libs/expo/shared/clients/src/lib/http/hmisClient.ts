import { getHmisApiUrl, getHmisAuthToken } from '@monorepo/expo/shared/utils';
import { MODERN_BROWSER_USER_AGENT } from '../common/constants';
import {
  ALLOWED_FILE_TYPES,
  AllowedFileType,
  ClientFileUploadRequest,
  ClientFileUploadResponse,
  ClientFilesListParams,
  ClientFilesResponse,
  FileCategory,
  FileCategoriesResponse,
  HmisError,
  HmisRequestOptions,
} from './hmisTypes';

/**
 * HMIS REST API Client
 *
 * Handles direct access to HMIS REST endpoints from React Native.
 * Automatically includes Bearer token auth and browser User-Agent.
 */
class HmisClient {
  /**
   * Get authorization headers including Bearer token
   */
  private async getHeaders(): Promise<HeadersInit> {
    const authToken = await getHmisAuthToken();

    if (!authToken) {
      throw new HmisError('Not authenticated with HMIS', 401);
    }

    return {
      Authorization: `Bearer ${authToken}`,
      'User-Agent': MODERN_BROWSER_USER_AGENT,
      Accept: 'application/json, text/plain, */*',
      'X-Requested-With': 'XMLHttpRequest',
    };
  }

  /**
   * Get HMIS API base URL from stored api_url
   */
  private getBaseUrl(): string {
    const apiUrl = getHmisApiUrl();
    if (!apiUrl) {
      throw new HmisError('HMIS API URL not found. Please log in first.', 500);
    }
    return apiUrl;
  }

  /**
   * Handle HTTP error responses with HMIS-specific error mapping
   */
  private async handleError(response: Response): Promise<never> {
    const contentType = response.headers.get('content-type');
    let data: unknown;

    try {
      data = contentType?.includes('application/json')
        ? await response.json()
        : await response.text();
    } catch {
      data = null;
    }

    switch (response.status) {
      case 401:
        throw new HmisError('Unauthorized - please log in', 401, data);

      case 403:
        throw new HmisError('Forbidden - insufficient permissions', 403, data);

      case 404:
        throw new HmisError('Resource not found', 404, data);

      case 422: {
        // HMIS returns validation errors as { messages: { field: message } }
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
    const baseUrl = this.getBaseUrl();
    const authHeaders = await this.getHeaders();

    // Build URL with query params
    const url = new URL(path, baseUrl);
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const fetchOptions: RequestInit = {
      method: options.method,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url.toString(), fetchOptions);

    // Handle errors
    if (!response.ok) {
      await this.handleError(response);
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: 'GET', params });
  }

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }

  put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /**
   * Upload multipart/form-data (e.g., for photo uploads)
   * Does NOT set Content-Type header (browser sets it with boundary automatically)
   * Does NOT JSON.stringify the body (FormData is sent as-is)
   */
  async postMultipart<T = unknown>(path: string, formData: FormData): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const authHeaders = await this.getHeaders();

    const url = new URL(path, baseUrl);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        ...authHeaders,
        // Do NOT set Content-Type - let the browser set it with the boundary
      },
      body: formData, // Send FormData directly without stringifying
    });

    // Handle errors
    if (!response.ok) {
      await this.handleError(response);
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
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
      throw new HmisError(
        `File type "${
          file.mimeType
        }" is not allowed. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}`,
        400
      );
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
   * Get available file categories for uploads
   *
   * Fetches the list of file categories that can be assigned when uploading
   * files for a client.
   *
   * @returns Promise with list of available file categories
   * @throws HmisError if the request fails
   *
   * @example
   * ```typescript
   * const categories = await hmisClient.getFileCategories();
   * categories.forEach(cat => {
   *   console.log(`${cat.id}: ${cat.name}`);
   * });
   * ```
   */
  async getFileCategories(): Promise<FileCategory[]> {
    const response = await this.get<FileCategoriesResponse>(
      '/client-file-categories'
    );

    return response.items;
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

    if (params?.sort) queryParams.sort = params.sort;
    if (params?.expand) queryParams.expand = params.expand;
    if (params?.is_file !== undefined)
      queryParams.is_file = String(params.is_file);
    if (params?.deleted !== undefined)
      queryParams.deleted = String(params.deleted);
    if (params?.page !== undefined) queryParams.page = String(params.page);
    if (params?.per_page !== undefined)
      queryParams.per_page = String(params.per_page);
    if (params?.fields) queryParams.fields = params.fields;

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

export const hmisClient = new HmisClient();
export { HmisClient };
