import { getHmisApiUrl, getHmisAuthToken } from '@monorepo/expo/shared/utils';
import { MODERN_BROWSER_USER_AGENT } from '../common/constants';
import { HmisError, HmisRequestOptions } from './hmisTypes';

/**
 * HMIS REST API Client
 *
 * Provides direct access to HMIS REST endpoints from React Native.
 * Automatically handles:
 * - Authorization Bearer token from cookies
 * - Base URL from stored api_url cookie
 * - Browser User-Agent requirement
 * - Automatic cookie management via credentials: 'include'
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
   * Get HMIS API base URL from stored cookie
   */
  private async getBaseUrl(): Promise<string> {
    const apiUrl = await getHmisApiUrl();
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
    let data: any;

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
        if (data?.messages) {
          const errors = Object.entries(data.messages)
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
   *
   * Note: Automatically includes X-Requested-With: XMLHttpRequest header
   * which is required by HMIS API.
   *
   * @param path - API path (e.g., '/current-user', '/clients/123')
   * @param options - Request options including method, body, params, headers
   * @returns Parsed JSON response
   */
  async request<T = any>(
    path: string,
    options: HmisRequestOptions = {}
  ): Promise<T> {
    const [baseUrl, authHeaders] = await Promise.all([
      this.getBaseUrl(),
      this.getHeaders(),
    ]);

    // Build URL with query params
    const url = new URL(path, baseUrl);
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Make request with automatic cookie management
    const response = await fetch(url.toString(), {
      ...options,
      credentials: 'include', // Automatic cookie sending/storage
      headers: {
        ...authHeaders,
        ...options.headers,
      },
      ...(options.body && {
        body: JSON.stringify(options.body),
      }),
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

    return response.text() as any;
  }

  /**
   * GET request
   */
  get<T = any>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: 'GET', params });
  }

  /**
   * POST request
   */
  post<T = any>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }

  /**
   * PUT request
   */
  put<T = any>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }

  /**
   * DELETE request
   */
  delete<T = any>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

/**
 * Singleton HMIS client instance
 */
export const hmisClient = new HmisClient();

/**
 * Export class for testing/custom instantiation
 */
export { HmisClient };
