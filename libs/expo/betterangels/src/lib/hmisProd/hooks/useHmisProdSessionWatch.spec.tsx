import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorHmisProd, type HmisProdRequestDebugInfo } from '../api';
import { useHmisProdSessionWatch } from './useHmisProdSessionWatch';

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
    user: { id: 'user-1', isHmisUser: true } as
      | { id: string; isHmisUser?: boolean }
      | undefined,
    flagEnabled: true,
    appBecameActive: false,
    signOut: vi.fn(() => Promise.resolve()),
    checkSession: vi.fn(),
    routerReplace: vi.fn(),
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

vi.mock('@monorepo/react/shared', () => ({
  useFeatureFlagActive: () => mocks.flagEnabled,
}));

vi.mock('expo-router', () => ({
  router: {
    replace: mocks.routerReplace,
    canGoBack: () => false,
    dismissAll: vi.fn(),
  },
}));

vi.mock('../../providers/user/UserProvider', () => ({
  useUser: () => ({ user: mocks.user }),
}));

vi.mock('../../hooks/user/useSignOut', () => ({
  default: () => ({ signOut: mocks.signOut }),
}));

vi.mock('../../hooks/appState/useAppState', () => ({
  default: () => ({ appBecameActive: mocks.appBecameActive }),
}));

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>();

  return {
    ...actual,
    createApiClientHmisProd: () => ({ checkSession: mocks.checkSession }),
  };
});

const debugInfo = (
  overrides: Partial<HmisProdRequestDebugInfo> = {},
): HmisProdRequestDebugInfo => ({
  url: 'https://betterangels-sandbox.clarityhs.com/api1/current-user?fields=id',
  hasAuthToken: true,
  authDomain: 'betterangels-sandbox.clarityhs.com',
  response: null,
  status: 401,
  ...overrides,
});

/** Lets pending effects and promise callbacks run before asserting. */
const flushAsyncWork = () => act(async () => undefined);

/**
 * Each test gets its own React Query client (the hook reads the query cache
 * to react to failed feature queries) that the test can also drive queries
 * through.
 */
const renderWatch = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const result = await renderHook(() => useHmisProdSessionWatch(), { wrapper });

  return { ...result, queryClient };
};

describe('useHmisProdSessionWatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'user-1', isHmisUser: true };
    mocks.flagEnabled = true;
    mocks.appBecameActive = false;
    mocks.checkSession.mockResolvedValue(undefined);
  });

  it('probes once when it becomes active and leaves a live session alone', async () => {
    await renderWatch();

    await waitFor(() => expect(mocks.checkSession).toHaveBeenCalledTimes(1));

    await flushAsyncWork();
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.routerReplace).not.toHaveBeenCalled();
  });

  it('force-signs out and routes to /auth when the token is missing', async () => {
    mocks.checkSession.mockRejectedValue(
      new ErrorHmisProd(
        'Not logged in to HMIS - please log in with your HMIS credentials',
        401,
        debugInfo({ hasAuthToken: false }),
      ),
    );

    await renderWatch();

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    expect(mocks.routerReplace).toHaveBeenCalledWith('/auth');
  });

  it('force-signs out on a 401 for an expired token', async () => {
    mocks.checkSession.mockRejectedValue(
      new ErrorHmisProd(
        'Unauthorized - please log in again.',
        401,
        debugInfo(),
      ),
    );

    await renderWatch();

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    expect(mocks.routerReplace).toHaveBeenCalledWith('/auth');
  });

  it('does not sign out on a transient 500', async () => {
    mocks.checkSession.mockRejectedValue(
      new ErrorHmisProd(
        'HTTP 500: Server Error',
        500,
        debugInfo({ status: 500 }),
      ),
    );

    await renderWatch();

    await waitFor(() => expect(mocks.checkSession).toHaveBeenCalledTimes(1));

    await flushAsyncWork();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it('does not probe when the feature flag is off', async () => {
    mocks.flagEnabled = false;

    await renderWatch();

    await flushAsyncWork();
    expect(mocks.checkSession).not.toHaveBeenCalled();
  });

  it('does not probe when the user did not log in via HMIS', async () => {
    mocks.user = { id: 'user-1', isHmisUser: false };

    await renderWatch();

    await flushAsyncWork();
    expect(mocks.checkSession).not.toHaveBeenCalled();
  });

  it('dedupes rapid foreground flips but checks again after the cooldown', async () => {
    const start = 1_700_000_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(start);

    try {
      const { rerender } = await renderWatch();

      await waitFor(() => expect(mocks.checkSession).toHaveBeenCalledTimes(1));

      // Foreground flip inside the cooldown → no second probe.
      mocks.appBecameActive = true;
      await rerender(undefined);
      await flushAsyncWork();
      expect(mocks.checkSession).toHaveBeenCalledTimes(1);

      // After the cooldown, the next flip checks again.
      nowSpy.mockReturnValue(start + 31_000);
      mocks.appBecameActive = false;
      await rerender(undefined);
      mocks.appBecameActive = true;
      await rerender(undefined);

      await waitFor(() => expect(mocks.checkSession).toHaveBeenCalledTimes(2));
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('releases the in-flight guard when a probe stalls (timeout)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_700_000_000_000);

    try {
      // A stalled request that only settles when its signal aborts.
      mocks.checkSession.mockImplementation(
        ({ signal }: { signal?: AbortSignal } = {}) =>
          new Promise((_resolve, reject) => {
            const onAbort = () => reject(new Error('Aborted'));

            if (signal?.aborted) {
              onAbort();
            } else {
              signal?.addEventListener('abort', onAbort);
            }
          }),
      );

      const { rerender } = await renderWatch();

      expect(mocks.checkSession).toHaveBeenCalledTimes(1);

      // The probe timeout fires; a timeout is not an auth failure.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000);
      });
      expect(mocks.signOut).not.toHaveBeenCalled();

      // Past the cooldown, the next foreground flip probes again — proving
      // the in-flight guard was released.
      vi.setSystemTime(1_700_000_000_000 + 31_000);
      mocks.appBecameActive = true;
      await rerender(undefined);

      expect(mocks.checkSession).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('force-signs out when a feature query fails with a session error', async () => {
    const { queryClient } = await renderWatch();

    await waitFor(() => expect(mocks.checkSession).toHaveBeenCalledTimes(1));

    await act(async () => {
      await queryClient
        .fetchQuery({
          queryKey: ['hmisProd', 'clientHistory', 'test-client'],
          queryFn: () =>
            Promise.reject(
              new ErrorHmisProd(
                'Unauthorized - please log in again.',
                401,
                debugInfo(),
              ),
            ),
          retry: false,
        })
        .catch(() => undefined);
    });

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    expect(mocks.routerReplace).toHaveBeenCalledWith('/auth');
  });

  it('does not sign out on a transient feature-query failure', async () => {
    const { queryClient } = await renderWatch();

    await waitFor(() => expect(mocks.checkSession).toHaveBeenCalledTimes(1));

    await act(async () => {
      await queryClient
        .fetchQuery({
          queryKey: ['hmisProd', 'clientHistory', 'test-client'],
          queryFn: () =>
            Promise.reject(
              new ErrorHmisProd(
                'HTTP 500: Server Error',
                500,
                debugInfo({ status: 500 }),
              ),
            ),
          retry: false,
        })
        .catch(() => undefined);
    });

    await flushAsyncWork();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it('ignores session errors from queries outside the feature', async () => {
    const { queryClient } = await renderWatch();

    await waitFor(() => expect(mocks.checkSession).toHaveBeenCalledTimes(1));

    await act(async () => {
      await queryClient
        .fetchQuery({
          queryKey: ['someOtherFeature'],
          queryFn: () =>
            Promise.reject(
              new ErrorHmisProd(
                'Unauthorized - please log in again.',
                401,
                debugInfo(),
              ),
            ),
          retry: false,
        })
        .catch(() => undefined);
    });

    await flushAsyncWork();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
});
