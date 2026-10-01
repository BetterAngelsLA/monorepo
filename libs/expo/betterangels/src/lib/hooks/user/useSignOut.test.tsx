import CookieManager from '@preeternal/react-native-cookie-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useSignOut from './useSignOut';

const mocks = vi.hoisted(() => ({
  logout: vi.fn(() => Promise.resolve()),
  clearStore: vi.fn(() => Promise.resolve()),
  clearQueries: vi.fn(),
  clearActiveOrgId: vi.fn(),
  cancelAllUploadRunners: vi.fn(),
  setUser: vi.fn(),
}));

vi.mock('@apollo/client', () => ({
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

vi.mock('@apollo/client/react', () => ({
  useApolloClient: () => ({ clearStore: mocks.clearStore }),
  useMutation: () => [mocks.logout, { loading: false, error: undefined }],
}));

vi.mock('@monorepo/ba-platform', () => ({
  clearActiveOrgId: mocks.clearActiveOrgId,
}));

// The clients barrel pulls in expo-modules-core, which vitest-native cannot
// strip; provide only the surface `useSignOut` uses.
vi.mock('@monorepo/expo/shared/clients', () => ({
  HMIS_API_URL_STORAGE_KEY: 'hmis_api_url',
  HMIS_AUTH_DOMAIN_STORAGE_KEY: 'hmis_auth_domain',
}));

vi.mock('@preeternal/react-native-cookie-manager', () => ({
  __esModule: true,
  default: { clearAll: vi.fn(() => Promise.resolve()) },
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ clear: mocks.clearQueries }),
}));

vi.mock('../../providers/uploadProgress/uploadRunnerRegistry', () => ({
  cancelAllUploadRunners: mocks.cancelAllUploadRunners,
}));

vi.mock('../../providers/user/UserProvider', () => ({
  useUser: () => ({ setUser: mocks.setUser }),
}));

describe('useSignOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears HMIS pointers, caches and user on success', async () => {
    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mocks.logout).toHaveBeenCalledTimes(1);
    expect(vi.mocked(CookieManager.clearAll)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(AsyncStorage.removeItem)).toHaveBeenCalledWith(
      'hmis_api_url',
    );
    expect(vi.mocked(AsyncStorage.removeItem)).toHaveBeenCalledWith(
      'hmis_auth_domain',
    );
    expect(mocks.clearStore).toHaveBeenCalledTimes(1);
    expect(mocks.clearQueries).toHaveBeenCalledTimes(1);
    expect(mocks.clearActiveOrgId).toHaveBeenCalledTimes(1);
    expect(mocks.setUser).toHaveBeenCalledWith(undefined);
  });

  it('still signs the user out locally when HMIS storage removal fails', async () => {
    vi.mocked(AsyncStorage.removeItem).mockRejectedValueOnce(
      new Error('storage unavailable'),
    );

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    // The failure must not abort the remaining cleanup steps...
    expect(mocks.clearStore).toHaveBeenCalledTimes(1);
    expect(mocks.clearQueries).toHaveBeenCalledTimes(1);
    expect(mocks.clearActiveOrgId).toHaveBeenCalledTimes(1);
    // ...and above all, the user must still end up signed out locally.
    expect(mocks.setUser).toHaveBeenCalledWith(undefined);
  });

  it('still signs the user out locally when clearing cookies fails', async () => {
    vi.mocked(CookieManager.clearAll).mockRejectedValueOnce(
      new Error('cookie store unavailable'),
    );

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mocks.clearStore).toHaveBeenCalledTimes(1);
    expect(mocks.setUser).toHaveBeenCalledWith(undefined);
  });
});
