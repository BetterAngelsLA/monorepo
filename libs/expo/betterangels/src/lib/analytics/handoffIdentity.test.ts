import type { AnalyticsClient } from './clientContract';

/**
 * The rule that decides what crosses into the shelter site.
 *
 * Platform-agnostic, so it is asserted against a fake client here rather than
 * twice through two SDKs. Both clients expose the same two ids, which is why
 * the rule can be tested once.
 */
const fake = vi.hoisted(() => ({
  client: null as null | Pick<
    AnalyticsClient,
    'getDistinctId' | 'getSessionId'
  >,
}));

vi.mock('./client', () => ({ getAnalyticsClient: () => fake.client }));

const sessionId = '018f4c0e-0000-7000-8000-000000000000';

beforeEach(() => {
  fake.client = {
    getDistinctId: () => 'distinct-1',
    getSessionId: () => sessionId,
  };
});

async function importIdentity() {
  vi.resetModules();

  return import('./handoffIdentity');
}

it('carries the distinct id only once identify() tied it to a worker', async () => {
  const { getHandoffIdentity, markAnalyticsIdentified } =
    await importIdentity();

  // Anonymous: the receiver would file a person who is nobody, and it drops a
  // session-only handoff, so nothing travels.
  expect(getHandoffIdentity()).toEqual({
    distinctId: undefined,
    sessionId: undefined,
  });

  markAnalyticsIdentified('distinct-1');
  expect(getHandoffIdentity()).toEqual({ distinctId: 'distinct-1', sessionId });
});

it('stops carrying the distinct id after the client is reset', async () => {
  const { getHandoffIdentity, markAnalyticsIdentified } =
    await importIdentity();

  markAnalyticsIdentified('distinct-1');

  // Clearing the local session resets the client; the id after that is
  // anonymous, so the comparison has to drop it without anyone remembering to
  // clear the marker.
  fake.client!.getDistinctId = () => 'anonymous-after-reset';

  expect(getHandoffIdentity().distinctId).toBeUndefined();
});

it('hands the session over with the person, not before', async () => {
  const { getHandoffIdentity, markAnalyticsIdentified } =
    await importIdentity();

  markAnalyticsIdentified('distinct-1');

  // shelter-web bootstraps a session only alongside a distinct id, so a
  // session id on its own would be a handoff the receiver silently drops.
  expect(getHandoffIdentity().sessionId).toBe(sessionId);
});

it('has nothing to hand over when no client exists', async () => {
  fake.client = null;

  const { getHandoffIdentity } = await importIdentity();

  expect(getHandoffIdentity()).toEqual({
    distinctId: undefined,
    sessionId: undefined,
  });
});
