import { act, renderHook, waitFor } from '@testing-library/react-native';
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
    getCurrentUser: vi.fn(),
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
    createApiClientHmisProd: () => ({ getCurrentUser: mocks.getCurrentUser }),
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

describe('useHmisProdSessionWatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'user-1', isHmisUser: true };
    mocks.flagEnabled = true;
    mocks.appBecameActive = false;
    mocks.getCurrentUser.mockResolvedValue({ data: { id: 1 } });
  });

  it('probes once when it becomes active and leaves a live session alone', async () => {
    renderHook(() => useHmisProdSessionWatch());

    await waitFor(() => expect(mocks.getCurrentUser).toHaveBeenCalledTimes(1));

    await flushAsyncWork();
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.routerReplace).not.toHaveBeenCalled();
  });

  it('force-signs out and routes to /auth when the token is missing', async () => {
    mocks.getCurrentUser.mockRejectedValue(
      new ErrorHmisProd(
        'Not logged in to HMIS - please log in with your HMIS credentials',
        401,
        debugInfo({ hasAuthToken: false }),
      ),
    );

    renderHook(() => useHmisProdSessionWatch());

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    expect(mocks.routerReplace).toHaveBeenCalledWith('/auth');
  });

  it('force-signs out on a 401 for an expired token', async () => {
    mocks.getCurrentUser.mockRejectedValue(
      new ErrorHmisProd(
        'Unauthorized - please log in again.',
        401,
        debugInfo(),
      ),
    );

    renderHook(() => useHmisProdSessionWatch());

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    expect(mocks.routerReplace).toHaveBeenCalledWith('/auth');
  });

  it('does not sign out on a transient 500', async () => {
    mocks.getCurrentUser.mockRejectedValue(
      new ErrorHmisProd(
        'HTTP 500: Server Error',
        500,
        debugInfo({ status: 500 }),
      ),
    );

    renderHook(() => useHmisProdSessionWatch());

    await waitFor(() => expect(mocks.getCurrentUser).toHaveBeenCalledTimes(1));

    await flushAsyncWork();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it('does not probe when the feature flag is off', async () => {
    mocks.flagEnabled = false;

    renderHook(() => useHmisProdSessionWatch());

    await flushAsyncWork();
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
  });

  it('does not probe when the user did not log in via HMIS', async () => {
    mocks.user = { id: 'user-1', isHmisUser: false };

    renderHook(() => useHmisProdSessionWatch());

    await flushAsyncWork();
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
  });

  it('dedupes rapid foreground flips but checks again after the cooldown', async () => {
    const start = 1_700_000_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(start);

    try {
      const { rerender } = renderHook(() => useHmisProdSessionWatch());

      await waitFor(() =>
        expect(mocks.getCurrentUser).toHaveBeenCalledTimes(1),
      );

      // Foreground flip inside the cooldown → no second probe.
      mocks.appBecameActive = true;
      rerender(undefined);
      await flushAsyncWork();
      expect(mocks.getCurrentUser).toHaveBeenCalledTimes(1);

      // After the cooldown, the next flip checks again.
      nowSpy.mockReturnValue(start + 31_000);
      mocks.appBecameActive = false;
      rerender(undefined);
      mocks.appBecameActive = true;
      rerender(undefined);

      await waitFor(() =>
        expect(mocks.getCurrentUser).toHaveBeenCalledTimes(2),
      );
    } finally {
      nowSpy.mockRestore();
    }
  });
});
