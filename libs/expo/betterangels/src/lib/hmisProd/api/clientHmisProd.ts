import {
  ErrorHmis,
  getAuthHeadersHmis,
  HEADER_NAMES,
  HEADER_VALUES,
  MODERN_BROWSER_USER_AGENT,
} from '@monorepo/expo/shared/clients';
import {
  HMIS_PROD_CLIENT_SEARCH_FIELDS,
  HMIS_PROD_CLIENTS_LONG_PATH,
} from './constants';
import type {
  SearchClientsPayloadHmisProd,
  SearchClientsResponseHmisProd,
} from './types';

/**
 * Direct HMIS ("prod") REST client — experimental, gated by
 * `FeatureFlags.HMIS_PROD_DEMO`.
 *
 * Feature-private: not exported from the `lib/hmisProd` barrel, so it can't
 * leak into other screens and goes away with the feature.
 *
 * Auth reuses the shared HMIS plumbing: `getAuthHeadersHmis` reads the
 * `auth_token` cookie from the native jar captured at HMIS login, so whichever
 * environment the user logged into (sandbox / LA prod) is the one we talk to.
 *
 * TODO: replace once Clarity ships their new REST API.
 */

const DEFAULT_SEARCH_PAYLOAD = {
  expand: 'userCreated,userUpdated',
  page: 1,
  per_page: 10,
  sort: '-last_updated',
  fields: HMIS_PROD_CLIENT_SEARCH_FIELDS,
} as const;

class ClientHmisProd {
  constructor(private readonly baseUrl: string) {}

  /**
   * Search clients via Clarity's "long" endpoint.
   *
   * POST /api1/clients/long
   */
  searchClients(
    payload: SearchClientsPayloadHmisProd,
  ): Promise<SearchClientsResponseHmisProd> {
    return this.post<SearchClientsResponseHmisProd>(
      HMIS_PROD_CLIENTS_LONG_PATH,
      { ...DEFAULT_SEARCH_PAYLOAD, ...payload },
    );
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);

    Object.entries(await getAuthHeadersHmis()).forEach(([key, value]) => {
      headers.set(key, value);
    });
    headers.set(HEADER_NAMES.USER_AGENT, MODERN_BROWSER_USER_AGENT);

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      await this.throwApiError(response);
    }

    // HMIS occasionally returns JSON with a wrong/missing Content-Type or a
    // double-encoded JSON string — parse defensively (same as `clientHmis`).
    const text = await response.text();
    if (!text) return text as unknown as T;

    try {
      const parsed = JSON.parse(text);

      if (typeof parsed === 'string') {
        try {
          return JSON.parse(parsed);
        } catch {
          return parsed as unknown as T;
        }
      }

      return parsed;
    } catch {
      return text as unknown as T;
    }
  }

  private post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: {
        [HEADER_NAMES.CONTENT_TYPE]: HEADER_VALUES.CONTENT_TYPE_JSON,
      },
      body: JSON.stringify(body),
    });
  }

  private async throwApiError(response: Response): Promise<never> {
    const contentType = response.headers.get('content-type');
    const data = await (contentType?.includes('application/json')
      ? response.json().catch(() => null)
      : response.text().catch(() => null));

    switch (response.status) {
      case 401:
        throw new ErrorHmis(
          'Unauthorized - please log in to HMIS with prod credentials',
          401,
          data,
        );
      case 403:
        throw new ErrorHmis('Forbidden - insufficient permissions', 403, data);
      case 404:
        throw new ErrorHmis('Resource not found', 404, data);
      default:
        throw new ErrorHmis(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data,
        );
    }
  }
}

// Factory function to create ClientHmisProd
export const createClientHmisProd = (baseUrl: string) =>
  new ClientHmisProd(baseUrl);

export { ClientHmisProd };
