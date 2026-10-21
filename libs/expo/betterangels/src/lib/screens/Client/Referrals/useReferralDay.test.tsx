import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { useReferralDay } from './useReferralDay';

it('refreshes at local midnight and on foreground, and cleans up the timer/listener', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(new Date(2026, 9, 19, 23, 59, 59));
  let foreground: ((state: AppStateStatus) => void) | undefined;
  const remove = vi.fn();
  const listen = vi
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, callback) => {
      foreground = callback;
      return { remove };
    });
  try {
    const view = await renderHook(useReferralDay);
    expect(view.result.current).toBe('2026-10-19');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(view.result.current).toBe('2026-10-20');
    vi.setSystemTime(new Date(2026, 9, 22, 12));
    await act(async () => foreground?.('active'));
    expect(view.result.current).toBe('2026-10-22');
    await view.unmount();
    expect(remove).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    listen.mockRestore();
    vi.useRealTimers();
  }
});
