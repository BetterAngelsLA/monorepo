import { buildInitConfig } from './posthog';

/**
 * Replay runs here as well as in the app, but this site is DOM-recorded, so the
 * masking is per element. `maskAllInputs` covers the address typed into the
 * location search; the suggestion list renders that address as text, so it is
 * blocked instead.
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
