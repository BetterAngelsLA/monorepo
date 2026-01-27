import { authStorage } from '@monorepo/expo/shared/utils';
import { MODERN_BROWSER_USER_AGENT } from '../common/constants';
import { HmisError, HmisRequestOptions } from './hmisTypes';

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
  private getHeaders(): HeadersInit {
    const authToken = authStorage.getHmisAuthToken();

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
    const apiUrl = authStorage.getHmisApiUrl();
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
  async request<T = any>(
    path: string,
    options: HmisRequestOptions = {}
  ): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const authHeaders = this.getHeaders();

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
}

export const hmisClient = new HmisClient();
export { HmisClient };
