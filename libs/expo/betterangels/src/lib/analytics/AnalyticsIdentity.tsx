import { useEffect } from 'react';
import { useUser } from '../providers/user/UserProvider';
import { getAnalyticsClient } from './client';

/**
 * Attaches the signed-in staff member to the analytics session.
 *
 * Without this every app user is one anonymous id per install: two workers
 * sharing a tablet look like one person, and a worker who signs out and hands
 * the device over keeps the previous identity. `identify` with the internal
 * user id is the minimum that makes the funnel mean "this worker", and it is
 * the *only* identifier ever sent — no name, no email, no role.
 *
 * Renders nothing. Mounted inside the user provider so it re-runs on sign-in;
 * `useSignOut` resets the client on the way out so the next sign-in does not
 * inherit the previous person.
 */
export function AnalyticsIdentity() {
  const { user } = useUser();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    getAnalyticsClient()?.identify(String(userId));
  }, [userId]);

  return null;
}
