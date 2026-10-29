import { useLayoutEffect, useRef } from 'react';
import {
  releaseReferralDraftSession,
  type ReferralDraftSession,
} from './referralDraftStorage';

/** UserProvider owns this lifecycle even while no referral screen is mounted. */
export function useReferralDraftSession({
  apiUrl,
  userId,
  organizationId,
}: {
  apiUrl: string;
  userId?: string;
  organizationId?: string;
}) {
  const normalizedApi = apiUrl.replace(/\/+$/, '');
  const previous = useRef<ReferralDraftSession | null>(null);
  const lifetime = useRef<object | null>(null);
  useLayoutEffect(() => {
    const session =
      userId && organizationId
        ? { apiUrl: normalizedApi, userId, organizationId }
        : null;
    const old = previous.current;
    if (
      old &&
      (old.apiUrl !== session?.apiUrl ||
        old.userId !== session?.userId ||
        old.organizationId !== session?.organizationId)
    ) {
      // Actual account/context changes revoke old actions before the next paint.
      releaseReferralDraftSession(old);
    }
    previous.current = session;
    const token = {};
    lifetime.current = token;
    return () => {
      // StrictMode immediately sets up this same effect again. Defer only final
      // unmount cleanup so that rehearsal cannot revoke a still-mounted store.
      queueMicrotask(() => {
        if (lifetime.current === token && session)
          releaseReferralDraftSession(session);
      });
    };
  }, [normalizedApi, userId, organizationId]);
}
