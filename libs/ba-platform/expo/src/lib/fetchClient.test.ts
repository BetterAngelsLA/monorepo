/**

 */

/* eslint-disable import/first */

import type { FetchInterceptor } from '@monorepo/fetch';

import {
  configureActiveOrgStorage,
  resetActiveOrgStoreForTests,
} from '@monorepo/ba-platform';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAsyncStorage: Record<string, string> = {};

vi.mock('@react-native-async-storage/async-storage', () => ({
  getItem: vi.fn((key: string) =>
    Promise.resolve(mockAsyncStorage[key] ?? null),
  ),
  setItem: vi.fn((key: string, value: string) => {
    mockAsyncStorage[key] = value;
    return Promise.resolve();
  }),
}));

const mockMmkv: Record<string, string> = {};
vi.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: (key: string) => mockMmkv[key],
    set: (key: string, value: string) => {
      mockMmkv[key] = value;
    },
    remove: (key: string) => {
      delete mockMmkv[key];
    },
  }),
}));

vi.mock('@preeternal/react-native-cookie-manager', () => ({
  get: vi.fn(() => Promise.resolve({ csrftoken: { value: 'csrf-native' } })),
  setFromResponse: vi.fn(() => Promise.resolve()),
}));

vi.mock('@monorepo/expo/shared/utils', () => ({
  asyncStorageAdapter: {
    getItem: (key: string) => Promise.resolve(mockAsyncStorage[key] ?? null),
    setItem: (key: string, value: string) => {
      mockAsyncStorage[key] = value;
      return Promise.resolve();
    },
  },
}));

vi.mock('@monorepo/expo/shared/clients', () => ({
  bodyInterceptor: (async (
    _input: RequestInfo | URL,
    init: RequestInit,
    next: (input: RequestInfo | URL, init: RequestInit) => Promise<Response>,
  ) => {
    return next(_input, init);
  }) as FetchInterceptor,
  includeCredentialsInterceptor: (async (
    _input: RequestInfo | URL,
    init: RequestInit,
    next: (input: RequestInfo | URL, init: RequestInit) => Promise<Response>,
  ) => {
    return next(_input, { ...init, credentials: 'include' });
  }) as FetchInterceptor,
}));

import { expoActiveOrgStorage } from './activeOrgStorage';
import { createExpoFetchClient } from './fetchClient';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createExpoFetchClient', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue(new Response());
    // Clear mock storage
    Object.keys(mockAsyncStorage).forEach((k) => delete mockAsyncStorage[k]);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    resetActiveOrgStoreForTests();
    Object.keys(mockMmkv).forEach((k) => delete mockMmkv[k]);
  });

  it('injects X-Organization-ID header from the active-org store', async () => {
    // Seeded through MMKV, the synchronous backing — not AsyncStorage, whose
    // round trip is what used to make the header lag the UI.
    mockMmkv['betterangels_active_org_id'] = 'org-expo';
    configureActiveOrgStorage(expoActiveOrgStorage);

    const fetchClient = createExpoFetchClient('https://api.example.com');
    await fetchClient('/graphql', { method: 'POST' });

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    const [, init] = fetchMock.mock.lastCall as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(headers.get('X-Organization-ID')).toBe('org-expo');
  });

  it('omits X-Organization-ID header when there is no active org', async () => {
    configureActiveOrgStorage(expoActiveOrgStorage);
    const fetchClient = createExpoFetchClient('https://api.example.com');
    await fetchClient('/graphql', { method: 'GET' });

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    const [, init] = fetchMock.mock.lastCall as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(headers.get('X-Organization-ID')).toBeNull();
  });

  it('appends extra interceptors after platform defaults', async () => {
    const extraInterceptor: FetchInterceptor = async (_input, init, next) => {
      const headers = new Headers(init.headers);
      headers.set('X-Custom', 'extra-value');
      return next(_input, { ...init, headers });
    };

    const fetchClient = createExpoFetchClient('https://api.example.com', [
      extraInterceptor,
    ]);
    await fetchClient('/graphql', { method: 'POST' });

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    const [, init] = fetchMock.mock.lastCall as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(headers.get('X-Custom')).toBe('extra-value');
  });
});
