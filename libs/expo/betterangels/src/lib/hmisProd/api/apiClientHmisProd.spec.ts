import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiClientHmisProd } from './apiClientHmisProd';
import { ErrorHmisProd, isAuthErrorHmisProd } from './errors';

const mocks = vi.hoisted(() => {
  class MockErrorHmis extends Error {
    status: number;
    data?: unknown;

    constructor(message: string, status: number, data?: unknown) {
      super(message);
      this.name = 'ErrorHmis';
      this.status = status;
      this.data = data;
    }
  }

  return {
    ErrorHmis: MockErrorHmis,
    hmisToken: 'token-1' as string | null,
  };
});

// The clients barrel pulls in expo-modules-core, which vitest-native cannot
// strip; provide only the surface `ApiClientHmisProd` uses.
vi.mock('@monorepo/expo/shared/clients', () => ({
  ErrorHmis: mocks.ErrorHmis,
  getAuthHeadersHmis: () =>
    Promise.resolve({
      Accept: 'application/json, text/plain, */*',
      'X-Requested-With': 'XMLHttpRequest',
      ...(mocks.hmisToken
        ? { Authorization: `Bearer ${mocks.hmisToken}` }
        : {}),
    }),
  HEADER_NAMES: {
    CONTENT_TYPE: 'Content-Type',
    USER_AGENT: 'User-Agent',
    ACCEPT: 'Accept',
    X_REQUESTED_WITH: 'X-Requested-With',
  },
  HEADER_VALUES: {
    CONTENT_TYPE_JSON: 'application/json',
    ACCEPT_JSON_ALL: 'application/json, text/plain, */*',
    X_REQUESTED_WITH_AJAX: 'XMLHttpRequest',
  },
  HMIS_AUTH_DOMAIN_STORAGE_KEY: 'hmis_auth_domain',
  MODERN_BROWSER_USER_AGENT: 'Mozilla/5.0 (test)',
  isApiDebug: false,
  formatDataForLog: (value: unknown) => value,
  formatResponseForLog: (value: unknown) => value,
}));

const BASE_URL = 'https://betterangels-sandbox.clarityhs.com';

const responseWith = (status: number, body = '') => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: String(status),
  text: () => Promise.resolve(body),
});

const fetchMock = vi.fn();

const setStoredToken = (token: string | null) => {
  mocks.hmisToken = token;
  vi.mocked(AsyncStorage.getItem).mockResolvedValue(BASE_URL);
};

describe('ApiClientHmisProd.getCurrentUser (session probe)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    mocks.hmisToken = 'token-1';
  });

  it('probes /api1/current-user with the stored HMIS token', async () => {
    setStoredToken('token-1');
    fetchMock.mockResolvedValueOnce(responseWith(200, '{"id":42}'));

    const client = createApiClientHmisProd(BASE_URL);
    const result = await client.getCurrentUser();

    expect(result.data.id).toBe(42);
    expect(result.debugInfo.hasAuthToken).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/api1/current-user?fields=id`);
    expect((init.headers as Headers).get('Authorization')).toBe(
      'Bearer token-1',
    );
  });

  it('classifies a 401 (expired token) as an auth error', async () => {
    setStoredToken('expired-token');
    fetchMock.mockResolvedValueOnce(responseWith(401, '{"status":401}'));

    const client = createApiClientHmisProd(BASE_URL);

    const error = await client.getCurrentUser().catch((err) => err);

    expect(error).toBeInstanceOf(ErrorHmisProd);
    expect(isAuthErrorHmisProd(error)).toBe(true);
  });

  it('fails fast without a request when no HMIS token is stored', async () => {
    setStoredToken(null);

    const client = createApiClientHmisProd(BASE_URL);

    const error = await client.getCurrentUser().catch((err) => err);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(error).toBeInstanceOf(ErrorHmisProd);
    expect(isAuthErrorHmisProd(error)).toBe(true);
  });

  it('does not classify a 500 as an auth error', async () => {
    setStoredToken('token-1');
    fetchMock.mockResolvedValueOnce(responseWith(500, 'oops'));

    const client = createApiClientHmisProd(BASE_URL);

    const error = await client.getCurrentUser().catch((err) => err);

    expect(error).toBeInstanceOf(ErrorHmisProd);
    expect(isAuthErrorHmisProd(error)).toBe(false);
  });

  it('does not classify a network failure as an auth error', async () => {
    setStoredToken('token-1');
    fetchMock.mockRejectedValueOnce(new Error('Network request failed'));

    const client = createApiClientHmisProd(BASE_URL);

    const error = await client.getCurrentUser().catch((err) => err);

    expect(error).toBeInstanceOf(ErrorHmisProd);
    expect(isAuthErrorHmisProd(error)).toBe(false);
  });
});
