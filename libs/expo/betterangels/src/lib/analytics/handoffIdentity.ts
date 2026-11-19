import type { ShelterHandoff } from '@monorepo/shared/shelter-handoff';
import { getAnalyticsClient } from './client';

/**
 * The identity the app carries into the shelter site.
 *
 * Platform-agnostic on purpose: it reads whichever client this build has
 * (`client.ts` on native, `client.web.ts` in a browser), so the handoff rule
 * exists once.
 */

/**
 * The distinct id this app tied to a worker, once `identify()` has run.
 *
 * Kept here rather than read from the client: the SDK has no public "is this id
 * a person?" accessor, and the handoff has to answer exactly that.
 */
let identifiedDistinctId: string | null = null;

/** Called by `AnalyticsIdentity` when the signed-in worker's id is attached. */
export function markAnalyticsIdentified(userId: string): void {
  identifiedDistinctId = userId;
}

/**
 * The identity to carry across a handoff.
 *
 * Both ids travel, or neither does. The distinct id alone is not enough to
 * trust: shelter-web reads a handed-over distinct id as a known person
 * (`isIdentifiedID`), so an anonymous one would create a person record for
 * nobody. The session id alone is not enough either — the receiver only
 * bootstraps a session together with a distinct id, so sending one on its own
 * reports a handoff it then silently drops. Clearing the local session resets
 * the client to a fresh anonymous id, which the comparison drops on its own.
 */
export function getHandoffIdentity(): ShelterHandoff {
  const client = getAnalyticsClient();
  const currentDistinctId = client?.getDistinctId();
  const identified =
    identifiedDistinctId !== null && currentDistinctId === identifiedDistinctId;

  return {
    distinctId: identified ? currentDistinctId : undefined,
    sessionId: identified ? client?.getSessionId() : undefined,
  };
}
