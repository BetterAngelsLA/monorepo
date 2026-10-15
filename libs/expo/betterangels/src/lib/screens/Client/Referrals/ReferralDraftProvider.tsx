import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { ReferralDraftStore } from './referralDraft';

const ReferralDraftContext = createContext<ReferralDraftStore | null>(null);

export function ReferralDraftProvider({
  store,
  children,
}: {
  store: ReferralDraftStore;
  children: ReactNode;
}) {
  return (
    <ReferralDraftContext.Provider value={store}>
      {children}
    </ReferralDraftContext.Provider>
  );
}

/** Actions-only consumers must not subscribe to answer/keystroke updates. */
export function useReferralDraftStore() {
  const store = useContext(ReferralDraftContext);
  if (!store)
    throw new Error('useReferralDraft requires ReferralDraftProvider');
  return store;
}

export function useReferralDraft() {
  const store = useReferralDraftStore();
  const draft = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const recovery = useSyncExternalStore(
    store.subscribe,
    store.getRecoveryState,
  );
  return { draft, recovery, store };
}
