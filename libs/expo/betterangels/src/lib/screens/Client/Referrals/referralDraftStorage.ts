import { createPersistentSynchronousStorage } from '@monorepo/expo/shared/utils';
import {
  createReferralDraftStore,
  type ReferralDraftStore,
} from './referralDraft';

// Preserve the existing single local draft across restarts. This storage is
// unencrypted and intended for the fictional-data prototype only.
const KEY = 'draft';
let store: ReferralDraftStore | undefined;

export function getPersistentReferralDraft(): ReferralDraftStore {
  if (!store) {
    const storage = createPersistentSynchronousStorage({
      scopeId: 'referral-draft',
    });
    store = createReferralDraftStore({
      load: () => storage.get<unknown>(KEY),
      save: (draft) => storage.set(KEY, draft),
      remove: () => storage.remove(KEY),
    });
  }
  return store;
}

/**
 * Best-effort wipe of the on-device draft, safe to call when none exists.
 *
 * Every session teardown must use this rather than `getPersistentReferralDraft()
 * .clear()` directly: the draft holds unencrypted sensitive answers, and a
 * throw from MMKV (or from anything that runs before it) must never leave it on
 * a device the next user can sign in to.
 */
export function clearPersistedReferralDraft(): void {
  try {
    getPersistentReferralDraft().clear();
  } catch (error) {
    console.error('[referralDraftStorage] failed to clear the draft', error);
  }
}
