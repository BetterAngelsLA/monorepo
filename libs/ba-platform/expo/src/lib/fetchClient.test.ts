/**

 */

/* eslint-disable import/first */

import type { FetchInterceptor } from '@monorepo/fetch';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

vi.mock('@monorepo/expo/shared/utils', () => ({}));

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
  });

  afterEach(() => {
    global.fetch = originalFetch;
    Object.keys(mockMmkv).forEach((k) => delete mockMmkv[k]);
  });

  it('injects X-Organization-ID header from the active-org store', async () => {
    mockMmkv['betterangels_active_org_id'] = 'org-expo';

    const fetchClient = createExpoFetchClient('https://api.example.com');
    await fetchClient('/graphql', { method: 'POST' });

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    const [, init] = fetchMock.mock.lastCall as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(headers.get('X-Organization-ID')).toBe('org-expo');
  });

  it('omits X-Organization-ID header when there is no active org', async () => {
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
