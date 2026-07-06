/**
 * @jest-environment node
 */
import type { FetchInterceptor } from '@monorepo/fetch';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAsyncStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockAsyncStorage[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockAsyncStorage[key] = value;
    return Promise.resolve();
  }),
}));

jest.mock('@preeternal/react-native-cookie-manager', () => ({
  get: jest.fn(() => Promise.resolve({ csrftoken: { value: 'csrf-native' } })),
  setFromResponse: jest.fn(() => Promise.resolve()),
}));

jest.mock('@monorepo/expo/shared/utils', () => ({
  asyncStorageAdapter: {
    getItem: (key: string) => Promise.resolve(mockAsyncStorage[key] ?? null),
    setItem: (key: string, value: string) => {
      mockAsyncStorage[key] = value;
      return Promise.resolve();
    },
  },
}));

jest.mock('@monorepo/expo/shared/clients', () => ({
  bodyInterceptor: (async (_input: RequestInfo | URL, init: RequestInit, next: (input: RequestInfo | URL, init: RequestInit) => Promise<Response>) => {
    return next(_input, init);
  }) as FetchInterceptor,
  includeCredentialsInterceptor: (async (_input: RequestInfo | URL, init: RequestInit, next: (input: RequestInfo | URL, init: RequestInit) => Promise<Response>) => {
    return next(_input, { ...init, credentials: 'include' });
  }) as FetchInterceptor,
}));

import { createExpoFetchClient } from './fetchClient';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createExpoFetchClient', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(new Response());
    // Clear mock storage
    Object.keys(mockAsyncStorage).forEach((k) => delete mockAsyncStorage[k]);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('injects X-Organization-ID header when org is stored', async () => {
    mockAsyncStorage['betterangels_active_org_id'] = 'org-expo';

    const fetchClient = createExpoFetchClient('https://api.example.com');
    await fetchClient('/graphql', { method: 'POST' });

    const fetchMock = global.fetch as jest.Mock;
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(headers.get('X-Organization-ID')).toBe('org-expo');
  });

  it('omits X-Organization-ID header when no org stored', async () => {
    const fetchClient = createExpoFetchClient('https://api.example.com');
    await fetchClient('/graphql', { method: 'GET' });

    const fetchMock = global.fetch as jest.Mock;
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(headers.get('X-Organization-ID')).toBeNull();
  });

  it('appends extra interceptors after platform defaults', async () => {
    const extraInterceptor: FetchInterceptor = async (_input, init, next) => {
      const headers = new Headers(init.headers);
      headers.set('X-Custom', 'extra-value');
      return next(_input, { ...init, headers });
    };

    const fetchClient = createExpoFetchClient('https://api.example.com', [extraInterceptor]);
    await fetchClient('/graphql', { method: 'POST' });

    const fetchMock = global.fetch as jest.Mock;
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(headers.get('X-Custom')).toBe('extra-value');
  });
});
