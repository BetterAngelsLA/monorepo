import { readHandoff } from './posthog';

/**
 * The handoff parameters are a contract with the outreach app
 * (`libs/expo/betterangels/src/lib/analytics/shelterHandoff.ts`). If one side
 * renames a parameter, nothing throws — the visit simply stops being joined to
 * the session that sent it, and the funnel quietly starts under-reporting.
 */
it('reads both identifiers out of the fragment', () => {
  expect(readHandoff('#ba_did=distinct-1&ba_sid=session-1')).toEqual({
    distinctId: 'distinct-1',
    sessionId: 'session-1',
  });
});

it('tolerates a fragment with only one identifier', () => {
  expect(readHandoff('#ba_sid=session-1')).toEqual({
    distinctId: undefined,
    sessionId: 'session-1',
  });
});

it('decodes percent-encoded values', () => {
  expect(readHandoff('#ba_did=a%26b%3Dc')).toEqual({
    distinctId: 'a&b=c',
    sessionId: undefined,
  });
});

it('returns nothing for an empty, unrelated, or absent fragment', () => {
  expect(readHandoff('')).toEqual({
    distinctId: undefined,
    sessionId: undefined,
  });
  expect(readHandoff('#section-2')).toEqual({
    distinctId: undefined,
    sessionId: undefined,
  });
});
