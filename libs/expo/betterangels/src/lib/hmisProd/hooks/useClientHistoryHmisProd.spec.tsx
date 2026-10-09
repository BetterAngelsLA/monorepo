import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorHmisProd, type HmisProdRequestDebugInfo } from '../api';
import { useClientHistoryHmisProd } from './useClientHistoryHmisProd';

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
    createApiClientHmisProd: vi.fn(),
    getClientHistory: vi.fn(),
  };
});

// The clients barrel pulls in expo-modules-core, which vitest-native cannot
// strip; provide only the surface reached through `../api`.
vi.mock('@monorepo/expo/shared/clients', () => ({
  ErrorHmis: mocks.ErrorHmis,
  getAuthHeadersHmis: () => Promise.resolve({}),
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

vi.mock('@monorepo/ba-platform', () => ({
  useApiConfig: () => ({ apiUrl: 'https://api.dev.betterangels.la' }),
}));

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();

  return {
    ...actual,
    createApiClientHmisProd: (baseUrl: string) => {
      mocks.createApiClientHmisProd(baseUrl);

      return { getClientHistory: mocks.getClientHistory };
    },
  };
});

/** `api.dev` resolves to the sandbox HMIS host (see resolveHmisProdBaseUrl). */
const SANDBOX_BASE_URL = 'https://betterangels-sandbox.clarityhs.com';

const debugInfo = (
  overrides: Partial<HmisProdRequestDebugInfo> = {},
): HmisProdRequestDebugInfo => ({
  url: `${SANDBOX_BASE_URL}/api1/clients/client-1/history?deleted=0&page=1&per_page=50`,
  hasAuthToken: true,
  authDomain: 'betterangels-sandbox.clarityhs.com',
  response: null,
  ...overrides,
});

/** Lets pending effects and promise callbacks run before asserting. */
const flushAsyncWork = () => act(async () => undefined);

const renderHistory = async (id: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return await renderHook(() => useClientHistoryHmisProd(id), { wrapper });
};

describe('useClientHistoryHmisProd', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches history for the id through the resolved HMIS host and unwraps data/debugInfo', async () => {
    const items = [{ id: 1, type: 'service', data: { name: 'Outreach' } }];
    const requestDebugInfo = debugInfo();

    mocks.getClientHistory.mockResolvedValue({
      data: { items },
      debugInfo: requestDebugInfo,
    });

    const { result } = await renderHistory('client-1');

    await waitFor(() => expect(result.current.data).toEqual({ items }));

    expect(mocks.getClientHistory).toHaveBeenCalledWith('client-1');
    expect(mocks.createApiClientHmisProd).toHaveBeenCalledWith(
      SANDBOX_BASE_URL,
    );
    expect(result.current.debugInfo).toEqual(requestDebugInfo);
  });

  it('surfaces the request debug info when the fetch fails', async () => {
    const requestDebugInfo = debugInfo({ status: 401 });

    mocks.getClientHistory.mockRejectedValue(
      new ErrorHmisProd(
        'Unauthorized - please log in again.',
        401,
        requestDebugInfo,
      ),
    );

    const { result } = await renderHistory('client-1');

    // Wait on `isError` — React Query initializes `error` to `null`, so an
    // `error` check would pass before the rejection lands.
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(ErrorHmisProd);
    expect(result.current.data).toBeUndefined();
    expect(result.current.debugInfo).toEqual(requestDebugInfo);
  });

  it('stays disabled until an id is available', async () => {
    await renderHistory('');

    await flushAsyncWork();

    expect(mocks.getClientHistory).not.toHaveBeenCalled();
  });
});
