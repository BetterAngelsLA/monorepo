import { buildInitConfig } from './posthog';

/**
 * Replay is on for the outreach app and deliberately off here. `posthog-js`
 * starts recording by itself when the project enables it, so the only thing
 * holding that back is this option — assert it rather than trusting the default.
 */
it('never records this public site, even when the project enables replay', () => {
  const config = buildInitConfig({ handoff: {} });

  expect(config.disable_session_recording).toBe(true);
});

it('continues the handed-over session when one arrives', () => {
  const config = buildInitConfig({
    handoff: { distinctId: 'distinct-1', sessionId: 'session-1' },
  });

  expect(config.bootstrap).toEqual({
    distinctID: 'distinct-1',
    sessionID: 'session-1',
  });
});

it('does not bootstrap without a distinct id', () => {
  const config = buildInitConfig({ handoff: { sessionId: 'session-1' } });

  expect(config.bootstrap).toBeUndefined();
});
