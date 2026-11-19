/**
 * The wiring that turns a signed-in worker into an analytics identity.
 *
 * `handoffIdentity.test.ts` proves the rule deciding *what* may cross into the
 * shelter site, and `client.test.ts` proves the client. Neither covers the only
 * component that calls `identify()`, so a component that stopped calling it
 * would break every handoff while both of those suites stayed green.
 *
 * Only `./client` is stubbed. `handoffIdentity` is the real module on purpose:
 * what these tests care about is the comparison between the id that was marked
 * and the id the client currently reports, and stubbing it would assert a stub.
 *
 * `render` / `rerender` are awaited because this renderer flushes passive
 * effects asynchronously; without the await the effect below has not run yet.
 */
import { render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsIdentity } from './AnalyticsIdentity';
import { getHandoffIdentity } from './handoffIdentity';

const state = vi.hoisted(() => ({
  userId: undefined as string | undefined,
  /** What the client reports. A sign-out resets it to a fresh anonymous id. */
  distinctId: 'anonymous-1',
  sessionId: '018f4c0e-0000-7000-8000-000000000000',
  /** A build with no project key has no client at all. */
  hasClient: true,
}));

const identify = vi.hoisted(() => vi.fn());

vi.mock('../providers/user/UserProvider', () => ({
  useUser: () => ({ user: state.userId ? { id: state.userId } : undefined }),
}));

vi.mock('./client', () => ({
  getAnalyticsClient: () =>
    state.hasClient
      ? {
          capture: vi.fn(),
          flush: async () => undefined,
          identify,
          reset: vi.fn(),
          getDistinctId: () => state.distinctId,
          getSessionId: () => state.sessionId,
        }
      : null,
}));

beforeEach(() => {
  identify.mockReset();
  state.userId = undefined;
  state.distinctId = 'anonymous-1';
  state.hasClient = true;
});

describe('AnalyticsIdentity', () => {
  it('attaches nothing before a worker signs in', async () => {
    await render(<AnalyticsIdentity />);

    expect(identify).not.toHaveBeenCalled();
    expect(getHandoffIdentity()).toEqual({
      distinctId: undefined,
      sessionId: undefined,
    });
  });

  it('identifies the worker, and the handoff then carries that same id', async () => {
    state.userId = 'user-1';
    state.distinctId = 'user-1';

    await render(<AnalyticsIdentity />);

    expect(identify).toHaveBeenCalledWith('user-1');
    // The point of the component: what reaches the shelter site is the id the
    // client was identified with, not an anonymous one.
    expect(getHandoffIdentity()).toEqual({
      distinctId: 'user-1',
      sessionId: state.sessionId,
    });
  });

  it('drops the id when only the client is reset, worker still signed in', async () => {
    state.userId = 'user-1';
    state.distinctId = 'user-1';

    const view = await render(<AnalyticsIdentity />);
    expect(getHandoffIdentity().distinctId).toBe('user-1');

    // `useClearLocalSession` resets the client to a fresh anonymous id. Only
    // that input changes here: `useUser()` still reports the worker, and the
    // remembered marker is deliberately never cleared. So the id comparison is
    // the only thing that can drop it — an implementation that dropped the
    // handoff on sign-out instead would still carry `user-1`.
    state.distinctId = 'anonymous-2';
    await view.rerender(<AnalyticsIdentity />);

    expect(getHandoffIdentity()).toEqual({
      distinctId: undefined,
      sessionId: undefined,
    });
  });

  it('stays dropped once the sign-out has also cleared the user', async () => {
    state.userId = 'user-1';
    state.distinctId = 'user-1';

    const view = await render(<AnalyticsIdentity />);
    expect(getHandoffIdentity().distinctId).toBe('user-1');

    state.distinctId = 'anonymous-2';
    await view.rerender(<AnalyticsIdentity />);
    state.userId = undefined;
    await view.rerender(<AnalyticsIdentity />);

    expect(getHandoffIdentity()).toEqual({
      distinctId: undefined,
      sessionId: undefined,
    });
  });

  it('renders in a build with no analytics client', async () => {
    state.userId = 'user-1';
    state.hasClient = false;

    await expect(render(<AnalyticsIdentity />)).resolves.toBeTruthy();
    expect(getHandoffIdentity()).toEqual({
      distinctId: undefined,
      sessionId: undefined,
    });
  });
});
