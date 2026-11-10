import { useEffect } from 'react';
import { useUser } from '../providers/user/UserProvider';
import { getAnalyticsClient } from './client';

/**
 * Attaches the signed-in worker to the analytics session.
 *
 * Without it an install is one anonymous id: two workers sharing a tablet look
 * like one person. The internal user id is the only identifier sent — no name,
 * email or role. `useSignOut` resets the client so the next sign-in does not
 * inherit this one.
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
