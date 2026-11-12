import {
  allowsAutomatedTraffic,
  buildInitConfig,
  handoffJoined,
} from './posthog';

/**
 * This site is DOM-recorded, so the masking is per element. `maskAllInputs`
 * covers the address typed into the location search; the suggestion list
 * renders that address as text, so it is blocked instead.
 *
 * The project decides *whether* anything records; this decides only what a
 * recording is allowed to contain.
 */
it('records this site but never leaves an input unmasked', () => {
  const config = buildInitConfig({ handoff: {} });

  expect(config.session_recording?.maskAllInputs).toBe(true);
  expect(config.session_recording?.blockSelector).toBe('.ph-no-capture');
});

it('continues the handed-over session when one arrives', () => {
  const config = buildInitConfig({
    handoff: { distinctId: 'distinct-1', sessionId: 'session-1' },
  });

  expect(config.bootstrap).toEqual({
    distinctID: 'distinct-1',
    sessionID: 'session-1',
    isIdentifiedID: true,
  });
});

it('does not bootstrap without a distinct id', () => {
  const config = buildInitConfig({ handoff: { sessionId: 'session-1' } });

  expect(config.bootstrap).toBeUndefined();
});

it('sends through the first-party proxy so blockers do not match the domain', () => {
  const config = buildInitConfig({ handoff: {} });

  expect(config.api_host).toBe('https://k.betterangels.la');
  // The toolbar and in-app links must still resolve to PostHog itself.
  expect(config.ui_host).toBe('https://us.posthog.com');
});

it('reports a join only when the receiver kept the handed session', () => {
  const handed = { distinctId: 'distinct-1', sessionId: 'session-1' };

  expect(handoffJoined(handed, 'session-1')).toBe(true);
  // posthog-js mints a new session when it rejects the bootstrapped id.
  expect(handoffJoined(handed, 'session-minted')).toBe(false);
  expect(handoffJoined({ distinctId: 'distinct-1' }, undefined)).toBe(false);
});

/**
 * The filter is what keeps bot traffic out of production; the test suite is a
 * bot, so it has to be off somewhere. A dev server and an e2e-built preview are
 * the two places an automated browser is expected.
 */
it('accepts an automated browser only from a dev server or an e2e preview', () => {
  expect(allowsAutomatedTraffic({ isDev: true, e2eFlag: undefined })).toBe(
    true,
  );
  expect(allowsAutomatedTraffic({ isDev: false, e2eFlag: 'true' })).toBe(true);
  expect(allowsAutomatedTraffic({ isDev: false, e2eFlag: undefined })).toBe(
    false,
  );
  expect(allowsAutomatedTraffic({ isDev: false, e2eFlag: 'false' })).toBe(
    false,
  );
});
