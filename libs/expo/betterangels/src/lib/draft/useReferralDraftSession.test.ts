import { StrictMode, createElement, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { useReferralDraftSession } from './useReferralDraftSession';
const { release } = vi.hoisted(() => ({ release: vi.fn() }));
vi.mock('./referralDraftStorage', () => ({
  releaseReferralDraftSession: release,
}));
const initial: Parameters<typeof useReferralDraftSession>[0] = {
  apiUrl: 'https://test-api',
  userId: 'user-1',
  organizationId: 'org-1',
};
afterEach(() => release.mockClear());
it.each([
  { userId: 'user-2' },
  { organizationId: 'org-2' },
  { apiUrl: 'https://other-api' },
  { userId: undefined, organizationId: undefined },
])(
  'releases the old session on context change or sign-out: %j',
  async (change) => {
    const { rerender, unmount } = await renderHook(
      (scope: Parameters<typeof useReferralDraftSession>[0]) =>
        useReferralDraftSession(scope),
      { initialProps: initial },
    );
    expect(release).not.toHaveBeenCalled();
    await rerender({ ...initial, ...change });
    expect(release).toHaveBeenCalledExactlyOnceWith(initial);
    await act(async () => await unmount());
  },
);
it('does not release drafts on ordinary rerenders or equivalent API spelling', async () => {
  const { rerender, unmount } = await renderHook(
    (scope: Parameters<typeof useReferralDraftSession>[0]) =>
      useReferralDraftSession(scope),
    { initialProps: initial },
  );
  await rerender({ ...initial });
  await rerender({ ...initial, apiUrl: `${initial.apiUrl}/` });
  expect(release).not.toHaveBeenCalled();
  await act(async () => await unmount());
  expect(release).toHaveBeenCalledExactlyOnceWith(initial);
});

it('keeps the active session through the StrictMode effect rehearsal', async () => {
  const { unmount } = await renderHook(() => useReferralDraftSession(initial), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(StrictMode, null, children),
  });
  await act(async () => undefined);
  expect(release).not.toHaveBeenCalled();
  await act(async () => await unmount());
  expect(release).toHaveBeenCalledExactlyOnceWith(initial);
});
