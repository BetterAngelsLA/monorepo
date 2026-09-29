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
