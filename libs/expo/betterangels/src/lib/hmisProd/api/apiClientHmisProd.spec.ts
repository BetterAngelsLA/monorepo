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

describe('ApiClientHmisProd.checkSession (session probe)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    mocks.hmisToken = 'token-1';
  });

  it('probes /api1/current-user with the stored HMIS token', async () => {
    setStoredToken('token-1');
    fetchMock.mockResolvedValueOnce(responseWith(200, '{"id":42}'));

    const client = createApiClientHmisProd(BASE_URL);

    await expect(client.checkSession()).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/api1/current-user?fields=id`);
    expect((init.headers as Headers).get('Authorization')).toBe(
      'Bearer token-1',
    );
  });

  it('forwards an AbortSignal to fetch so callers can bound the probe', async () => {
    setStoredToken('token-1');
    fetchMock.mockResolvedValueOnce(responseWith(200, '{"id":42}'));
    const controller = new AbortController();

    const client = createApiClientHmisProd(BASE_URL);
    await client.checkSession({ signal: controller.signal });

    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).signal).toBe(controller.signal);
  });

  it('classifies a 401 (expired token) as an auth error', async () => {
    setStoredToken('expired-token');
    fetchMock.mockResolvedValueOnce(responseWith(401, '{"status":401}'));

    const client = createApiClientHmisProd(BASE_URL);

    const error = await client.checkSession().catch((err) => err);

    expect(error).toBeInstanceOf(ErrorHmisProd);
    expect(isAuthErrorHmisProd(error)).toBe(true);
  });

  it('fails fast without a request when no HMIS token is stored', async () => {
    setStoredToken(null);

    const client = createApiClientHmisProd(BASE_URL);

    const error = await client.checkSession().catch((err) => err);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(error).toBeInstanceOf(ErrorHmisProd);
    expect(isAuthErrorHmisProd(error)).toBe(true);
  });

  it('does not classify a 500 as an auth error', async () => {
    setStoredToken('token-1');
    fetchMock.mockResolvedValueOnce(responseWith(500, 'oops'));

    const client = createApiClientHmisProd(BASE_URL);

    const error = await client.checkSession().catch((err) => err);

    expect(error).toBeInstanceOf(ErrorHmisProd);
    expect(isAuthErrorHmisProd(error)).toBe(false);
  });

  it('does not classify a network failure as an auth error', async () => {
    setStoredToken('token-1');
    fetchMock.mockRejectedValueOnce(new Error('Network request failed'));

    const client = createApiClientHmisProd(BASE_URL);

    const error = await client.checkSession().catch((err) => err);

    expect(error).toBeInstanceOf(ErrorHmisProd);
    expect(isAuthErrorHmisProd(error)).toBe(false);
  });
});

describe('ApiClientHmisProd.getClientHistory (client history)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    mocks.hmisToken = 'token-1';
  });

  it('treats explicitly-undefined payload entries as absent, keeping the defaults', async () => {
    setStoredToken('token-1');
    fetchMock.mockResolvedValueOnce(responseWith(200, '{"items":[]}'));

    const client = createApiClientHmisProd(BASE_URL);

    await client.getClientHistory('123', {
      deleted: undefined,
      page: undefined,
      per_page: undefined,
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `${BASE_URL}/api1/clients/123/history?deleted=0&page=1&per_page=50`,
    );
  });

  it('overlays defined payload entries on the defaults', async () => {
    setStoredToken('token-1');
    fetchMock.mockResolvedValueOnce(responseWith(200, '{"items":[]}'));

    const client = createApiClientHmisProd(BASE_URL);

    await client.getClientHistory('123', { page: '2', per_page: undefined });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `${BASE_URL}/api1/clients/123/history?deleted=0&page=2&per_page=50`,
    );
  });
});

describe('ApiClientHmisProd.getClientPrograms (client programs)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    mocks.hmisToken = 'token-1';
  });

  it('requests the client-programs endpoint with the default query and fields', async () => {
    setStoredToken('token-1');
    fetchMock.mockResolvedValueOnce(responseWith(200, '{"items":[]}'));

    const client = createApiClientHmisProd(BASE_URL);

    await client.getClientPrograms('123');

    const [url] = fetchMock.mock.calls[0];
    const [path, queryString] = url.split('?');
    const query = new URLSearchParams(queryString);

    expect(path).toBe(`${BASE_URL}/api1/clients/123/client-programs`);
    expect(query.get('deleted')).toBe('0');
    expect(query.get('sort')).toBe('-start_date');
    expect(query.get('page')).toBe('1');
    expect(query.get('per_page')).toBe('50');

    const fields = query.get('fields')?.split(',') ?? [];
    expect(fields).toContain('program.name');
    expect(fields).toContain('referralNotDeleted.status');
    // Household members are deliberately not requested yet.
    expect(
      fields.some((field) => field.startsWith('groupAllProgramMembers')),
    ).toBe(false);
  });

  it('treats explicitly-undefined payload entries as absent, keeping the defaults', async () => {
    setStoredToken('token-1');
    fetchMock.mockResolvedValueOnce(responseWith(200, '{"items":[]}'));

    const client = createApiClientHmisProd(BASE_URL);

    await client.getClientPrograms('123', {
      deleted: undefined,
      sort: undefined,
      page: undefined,
      per_page: undefined,
    });

    const [url] = fetchMock.mock.calls[0];
    const query = new URLSearchParams(url.split('?')[1]);

    expect(query.get('deleted')).toBe('0');
    expect(query.get('sort')).toBe('-start_date');
    expect(query.get('page')).toBe('1');
    expect(query.get('per_page')).toBe('50');
  });

  it('overlays defined payload entries on the defaults', async () => {
    setStoredToken('token-1');
    fetchMock.mockResolvedValueOnce(responseWith(200, '{"items":[]}'));

    const client = createApiClientHmisProd(BASE_URL);

    await client.getClientPrograms('123', { page: '2', per_page: undefined });

    const [url] = fetchMock.mock.calls[0];
    const query = new URLSearchParams(url.split('?')[1]);

    expect(query.get('page')).toBe('2');
    expect(query.get('per_page')).toBe('50');
  });

  it('joins the `fields` payload override into the query', async () => {
    setStoredToken('token-1');
    fetchMock.mockResolvedValueOnce(responseWith(200, '{"items":[]}'));

    const client = createApiClientHmisProd(BASE_URL);

    await client.getClientPrograms('123', { fields: ['id', 'program.name'] });

    const [url] = fetchMock.mock.calls[0];
    const query = new URLSearchParams(url.split('?')[1]);

    expect(query.get('fields')).toBe('id,program.name');
  });
});
