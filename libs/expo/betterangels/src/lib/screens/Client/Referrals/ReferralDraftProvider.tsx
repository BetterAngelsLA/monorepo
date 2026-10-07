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

export function useReferralDraft() {
  const store = useContext(ReferralDraftContext);
  if (!store)
    throw new Error('useReferralDraft requires ReferralDraftProvider');
  const draft = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return { draft, store };
}
