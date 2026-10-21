import { createPersistentSynchronousStorage } from '@monorepo/expo/shared/utils';
import { randomUUID } from 'expo-crypto';
import { createMMKV } from 'react-native-mmkv';
import {
  createReferralDraftStore,
  type ReferralDraftStore,
} from './referralDraft';

export type ReferralDraftScope = Readonly<{
  apiUrl: string;
  userId: string;
  organizationId: string;
  clientId: string;
}>;
export type ReferralDraftSession = Omit<ReferralDraftScope, 'clientId'>;
export type ReferralDraftAccount = Pick<
  ReferralDraftScope,
  'apiUrl' | 'userId'
>;

// Local prototype storage remains unencrypted. Identity boundaries prevent
// accidental reuse between clients, accounts, organizations, and environments.
const stores = new Map<string, ReferralDraftStore>();
const legacyStorage = () =>
  createPersistentSynchronousStorage({ scopeId: 'referral-draft' });

/**
 * Session teardown always wipes the unowned legacy record before async cleanup
 * and revokes every loaded draft's callbacks. Scoped disk records are retained
 * for the same authenticated account; account-local removal is explicit.
 */
export function clearPersistedReferralDraft(): void {
  try {
    legacyStorage().remove('draft');
  } catch (error) {
    console.error(
      '[referralDraftStorage] failed to clear the legacy draft',
      error,
    );
  }
  for (const [key, store] of stores) {
    stores.delete(key);
    store.release();
  }
}
function storage() {
  const backing = createMMKV({ id: 'referral-drafts-v2' });
  return {
    get(key: string): unknown {
      const raw = backing.getString(key);
      if (raw === undefined) return null;
      const value: unknown = JSON.parse(raw);
      if (value === null) throw new SyntaxError('Stored draft is null');
      return value;
    },
    set: (key: string, value: unknown) =>
      backing.set(key, JSON.stringify(value)),
    remove: (key: string) => backing.remove(key),
    keys: () => backing.getAllKeys(),
  };
}
function scopeKey(scope: ReferralDraftScope) {
  const parts = [
    scope.apiUrl.replace(/\/+$/, ''),
    scope.userId,
    scope.organizationId,
    scope.clientId,
  ];
  if (parts.some((part) => !part.trim()))
    throw new Error('Referral draft requires a complete scope');
  return JSON.stringify(parts);
}

export function getPersistentReferralDraft(
  scope: ReferralDraftScope,
): ReferralDraftStore {
  const key = scopeKey(scope);
  const existing = stores.get(key);
  if (existing) return existing;
  // Opening native storage can fail too; keep it inside the recoverable load /
  // write boundary, and retry initialization after a transient failure.
  let backing: ReturnType<typeof storage> | undefined;
  const getBacking = () => (backing ??= storage());
  const store = createReferralDraftStore(
    {
      load: () => {
        const value = getBacking().get(key);
        if (
          value &&
          typeof value === 'object' &&
          'clientId' in value &&
          value.clientId !== scope.clientId
        )
          throw new Error('Referral draft client mismatch');
        return value;
      },
      save: (draft) => {
        if (draft.clientId !== scope.clientId)
          throw new Error('Referral draft client mismatch');
        getBacking().set(key, draft);
      },
      remove: () => getBacking().remove(key),
    },
    randomUUID,
  );
  stores.set(key, store);
  return store;
}

function readLegacyDraft(clientId: string) {
  const draft = createReferralDraftStore(
    {
      load: () => legacyStorage().get<unknown>('draft'),
      save: () => undefined,
      remove: () => undefined,
    },
    randomUUID,
  ).getSnapshot();
  return draft?.clientId === clientId ? draft : null;
}

export function hasLegacyReferralDraft(clientId: string): boolean {
  return readLegacyDraft(clientId) !== null;
}

/** Explicit recovery: the old record has no account/environment ownership. */
export function recoverLegacyReferralDraft(scope: ReferralDraftScope): boolean {
  const key = scopeKey(scope);
  const current = getPersistentReferralDraft(scope);
  if (current.getSnapshot() || current.getRecoveryState()) return false;
  const draft = readLegacyDraft(scope.clientId);
  if (!draft) return false;
  const { storedValues: _values, answers: _answers, ...persisted } = draft;
  storage().set(key, persisted);
  // Publish the scoped copy even if removing the older copy fails. Otherwise a
  // cached empty store could overwrite the successfully recovered answers.
  stores.delete(key);
  legacyStorage().remove('draft');
  return true;
}

function belongsTo(
  key: string,
  account: ReferralDraftAccount,
  organizationId?: string,
) {
  try {
    const parts: unknown = JSON.parse(key);
    return (
      Array.isArray(parts) &&
      parts.length === 4 &&
      parts.every((part) => typeof part === 'string' && part.trim()) &&
      parts[0] === account.apiUrl.replace(/\/+$/, '') &&
      parts[1] === account.userId &&
      (organizationId === undefined || parts[2] === organizationId)
    );
  } catch {
    return false;
  }
}

/** Retain disk drafts for the same account; revoke in-memory callbacks/forms. */
export function releaseReferralDraftSession(session: ReferralDraftSession) {
  for (const [key, store] of stores) {
    if (!belongsTo(key, session, session.organizationId)) continue;
    stores.delete(key);
    store.release();
  }
}

/** Explicit account-local deletion across organizations, never another account/API. */
export function discardAccountReferralDrafts(account: ReferralDraftAccount) {
  if (!account.apiUrl.trim() || !account.userId.trim())
    throw new Error('Incomplete draft account');
  const backing = storage();
  for (const key of backing.keys()) {
    if (!belongsTo(key, account)) continue;
    backing.remove(key);
    stores.get(key)?.release();
    stores.delete(key);
  }
  // Also revoke empty stores, so previously captured actions cannot recreate data.
  for (const [key, store] of stores) {
    if (!belongsTo(key, account)) continue;
    stores.delete(key);
    store.release();
  }
}
