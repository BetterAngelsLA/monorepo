import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { fetchDeployedBuildId } from './fetchDeployedBuildId';
import { isReloadGuardActive } from './reloadGuard';
import {
  isStaleBuild,
  POLL_INTERVAL_MS,
  useWebUpdateCheck,
} from './useWebUpdateCheck';

/**
 * The hook refuses to run off web (`expo-updates` has no OTA channel there, and
 * the effect bails). These run on the native test platform, so the platform is
 * forced for the duration — the same thing a browser does.
 */
vi.mock('./fetchDeployedBuildId', () => ({ fetchDeployedBuildId: vi.fn() }));
vi.mock('./reloadGuard', () => ({
  isReloadGuardActive: vi.fn(() => false),
  markReloadAttempt: vi.fn(),
}));

const OWN = 'aaaa11112222';
const OTHER = 'bbbb33334444';

const mockDeployed = (value: string | null) =>
  vi.mocked(fetchDeployedBuildId).mockResolvedValue(value);

const originalOS = Platform.OS;

beforeEach(() => {
  vi.mocked(fetchDeployedBuildId).mockReset();
  vi.mocked(isReloadGuardActive).mockReturnValue(false);
  Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
});

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  vi.useRealTimers();
});

// No default: `mount(undefined)` must mean "no build id", not "fall back to
// the fixture" — that is the case under test.
const mount = async (ownBuildId?: string) =>
  renderHook(() => useWebUpdateCheck(ownBuildId));

describe('useWebUpdateCheck', () => {
  it('offers a reload when the deployment has moved on', async () => {
    mockDeployed(OTHER);

    const { result } = await mount(OWN);

    await waitFor(() => expect(result.current.updateAvailable).toBe(true));
  });

  it('stays quiet when the deployment matches', async () => {
    mockDeployed(OWN);

    const { result } = await mount(OWN);

    await waitFor(() => expect(fetchDeployedBuildId).toHaveBeenCalled());

    expect(result.current.updateAvailable).toBe(false);
  });

  it('stays quiet when the deployment publishes nothing', async () => {
    mockDeployed(null);

    const { result } = await mount(OWN);

    await waitFor(() => expect(fetchDeployedBuildId).toHaveBeenCalled());

    expect(result.current.updateAvailable).toBe(false);
  });

  it('clears the prompt when a rollback makes the tab current again', async () => {
    // Without an assignment back to false the modal stays on a healthy page,
    // offering a reload that would change nothing.
    mockDeployed(OTHER);

    const { result } = await mount(OWN);

    await waitFor(() => expect(result.current.updateAvailable).toBe(true));

    mockDeployed(OWN);

    await act(async () => {
      await result.current.check();
    });

    expect(result.current.updateAvailable).toBe(false);
  });

  it('does not prompt while a reload guard is active', async () => {
    mockDeployed(OTHER);
    vi.mocked(isReloadGuardActive).mockReturnValue(true);

    const { result } = await mount(OWN);

    await waitFor(() => expect(fetchDeployedBuildId).toHaveBeenCalled());

    expect(result.current.updateAvailable).toBe(false);
  });

  it('does not even check when the bundle has no id', async () => {
    await mount(undefined);

    expect(fetchDeployedBuildId).not.toHaveBeenCalled();
  });

  it('re-arms a dismissal on the scheduled poll, not on a focus check', async () => {
    vi.useFakeTimers();
    mockDeployed(OTHER);

    const { result } = await mount(OWN);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.updateAvailable).toBe(true);

    await act(async () => {
      result.current.dismiss();
    });
    expect(result.current.dismissed).toBe(true);

    // A visibility-driven check must not re-open it …
    await act(async () => {
      await result.current.check();
    });
    expect(result.current.dismissed).toBe(true);

    // … but the scheduled poll does, so a stale tab is not muted for its life.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS + 1);
    });
    expect(result.current.dismissed).toBe(false);
  });
});

describe('isStaleBuild', () => {
  it('still refuses to compare non-sha ids', () => {
    expect(isStaleBuild('release-1', OTHER)).toBe(false);
  });
});
