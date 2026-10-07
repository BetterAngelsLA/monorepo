import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorHmisProd, type HmisProdRequestDebugInfo } from '../api';
import { useClientProgramsHmisProd } from './useClientProgramsHmisProd';

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
    getClientPrograms: vi.fn(),
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

      return { getClientPrograms: mocks.getClientPrograms };
    },
  };
});

/** `api.dev` resolves to the sandbox HMIS host (see resolveHmisProdBaseUrl). */
const SANDBOX_BASE_URL = 'https://betterangels-sandbox.clarityhs.com';

const debugInfo = (
  overrides: Partial<HmisProdRequestDebugInfo> = {},
): HmisProdRequestDebugInfo => ({
  url: `${SANDBOX_BASE_URL}/api1/clients/client-1/client-programs?deleted=0&sort=-start_date&page=1&per_page=50`,
  hasAuthToken: true,
  authDomain: 'betterangels-sandbox.clarityhs.com',
  response: null,
  ...overrides,
});

/** Lets pending effects and promise callbacks run before asserting. */
const flushAsyncWork = () => act(async () => undefined);

const renderPrograms = (id: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return renderHook(() => useClientProgramsHmisProd(id), { wrapper });
};

describe('useClientProgramsHmisProd', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches programs for the id through the resolved HMIS host and unwraps data/debugInfo', async () => {
    const items = [{ id: 1, program: { name: 'Housing Program' } }];
    const requestDebugInfo = debugInfo();

    mocks.getClientPrograms.mockResolvedValue({
      data: { items },
      debugInfo: requestDebugInfo,
    });

    const { result } = renderPrograms('client-1');

    await waitFor(() => expect(result.current.data).toEqual({ items }));

    expect(mocks.getClientPrograms).toHaveBeenCalledWith('client-1');
    expect(mocks.createApiClientHmisProd).toHaveBeenCalledWith(
      SANDBOX_BASE_URL,
    );
    expect(result.current.debugInfo).toEqual(requestDebugInfo);
  });

  it('surfaces the request debug info when the fetch fails', async () => {
    const requestDebugInfo = debugInfo({ status: 401 });

    mocks.getClientPrograms.mockRejectedValue(
      new ErrorHmisProd(
        'Unauthorized - please log in again.',
        401,
        requestDebugInfo,
      ),
    );

    const { result } = renderPrograms('client-1');

    // Wait on `isError` — React Query initializes `error` to `null`, so an
    // `error` check would pass before the rejection lands.
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(ErrorHmisProd);
    expect(result.current.data).toBeUndefined();
    expect(result.current.debugInfo).toEqual(requestDebugInfo);
  });

  it('stays disabled until an id is available', async () => {
    renderPrograms('');

    await flushAsyncWork();

    expect(mocks.getClientPrograms).not.toHaveBeenCalled();
  });
});
