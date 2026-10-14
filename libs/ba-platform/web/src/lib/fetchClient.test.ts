/* eslint-disable import/first */

// jsdom does not provide the ``Response`` global (it is a Node built-in).
// Define a minimal stub so the mock fetch can resolve.
if (typeof Response === 'undefined') {
  (globalThis as Record<string, unknown>).Response = class {
    readonly status: number;
    readonly headers: Headers;
    constructor(_body?: BodyInit | null, _init?: ResponseInit) {
      this.status = 200;
      this.headers = new Headers();
    }
  } as unknown as typeof Response;
}

import { createWebFetchClient } from './fetchClient';

describe('createWebFetchClient', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue(new Response());

    // Reset localStorage mock
    const storage: Record<string, string> = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => storage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage[key] = value;
        }),
      },
      writable: true,
    });

    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      const n =
        c.indexOf('=') > -1 ? c.substring(0, c.indexOf('=')).trim() : c.trim();
      document.cookie = `${n}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('injects X-Organization-ID header from the active-org store', async () => {
    window.localStorage.setItem('betterangels_active_org_id', 'org-1');
    document.cookie = 'csrftoken=csrf-abc; Path=/';

    const fetchClient = createWebFetchClient();
    await fetchClient('/api/test', { method: 'POST' });

    const fetchMock = global.fetch as vi.Mock;
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(headers.get('X-Organization-ID')).toBe('org-1');
    expect(headers.get('x-csrftoken')).toBe('csrf-abc');
  });

  it('omits X-Organization-ID header when there is no active org', async () => {
    document.cookie = 'csrftoken=csrf-abc; Path=/';

    const fetchClient = createWebFetchClient();
    await fetchClient('/api/test', { method: 'GET' });

    const fetchMock = global.fetch as vi.Mock;
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(headers.get('X-Organization-ID')).toBeNull();
    expect(headers.get('x-csrftoken')).toBe('csrf-abc');
  });

  it('reads the namespaced token cookie behind a dev-proxy target', async () => {
    // The proxy keeps each target's cookies apart, so the token for
    // `/__api/demo` is `demo_csrftoken`, not `csrftoken`.
    document.cookie = 'demo_csrftoken=csrf-demo; Path=/';

    const fetchClient = createWebFetchClient('http://localhost:8081/__api/demo');
    await fetchClient('/__api/demo/graphql', { method: 'POST' });

    const fetchMock = global.fetch as vi.Mock;
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(new Headers(init.headers).get('x-csrftoken')).toBe('csrf-demo');
  });

  it('bootstraps the token under the target prefix', async () => {
    const fetchClient = createWebFetchClient('http://localhost:8081/__api/demo');
    await fetchClient('/__api/demo/graphql', { method: 'POST' });

    // No token cookie to start with, so the interceptor mints one by GETting the
    // login path — which has to stay inside the target, or it 404s through the
    // dev server.
    const fetchMock = global.fetch as vi.Mock;
    const urls = fetchMock.mock.calls.map(([url]) => String(url));

    expect(urls.some((u) => u.startsWith('/__api/demo/admin/login/'))).toBe(true);
  });

  it('preserves existing custom headers', async () => {
    document.cookie = 'csrftoken=csrf-abc; Path=/';

    const fetchClient = createWebFetchClient();
    await fetchClient('/api/test', {
      headers: { Authorization: 'Bearer token' },
    });

    const fetchMock = global.fetch as vi.Mock;
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(headers.get('Authorization')).toBe('Bearer token');
  });
});
