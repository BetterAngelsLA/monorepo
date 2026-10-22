import { endReferralDraftSession } from './referralDraftStorage';
const { stores } = vi.hoisted(() => ({
  stores: new Map<string, Map<string, string>>(),
}));
vi.mock('react-native-mmkv', () => ({
  MMKV: vi.fn(),
  createMMKV: vi.fn((config: { id: string }) => {
    if (!stores.has(config.id)) stores.set(config.id, new Map());
    const backing = stores.get(config.id);
    if (!backing) throw new Error('Expected an initialized MMKV mock');
    return {
      getAllKeys: () => [...backing.keys()],
      getString: (key: string) => backing.get(key),
      set: (key: string, value: string) => backing.set(key, value),
      remove: (key: string) => backing.delete(key),
    };
  }),
}));

vi.mock('expo-crypto', async () => ({
  randomUUID: (await import('node:crypto')).randomUUID,
}));
const scope = {
  apiUrl: 'http://local/graphql',
  userId: 'user-1',
  organizationId: 'org-1',
  clientId: 'client-1',
};
beforeEach(() => {
  endReferralDraftSession();
  stores.clear();
});

it('clears unowned legacy data and revokes callbacks at sign-out while retaining scoped drafts on disk', async () => {
  const { getPersistentReferralDraft, endReferralDraftSession } =
    await import('./referralDraftStorage');
  const draft = getPersistentReferralDraft(scope);
  draft.startNew(scope.clientId);
  draft.setField('notes', 'Fictional retained answer');
  stores.set('referral-draft', new Map([['draft', 'legacy answer']]));
  endReferralDraftSession();
  expect(stores.get('referral-draft')?.has('draft')).toBe(false);
  expect(draft.getSnapshot()).toBeNull();
  expect(draft.setField('notes', 'stale callback')).toBe(false);
  expect(getPersistentReferralDraft(scope).getSnapshot()?.answers.notes).toBe(
    'Fictional retained answer',
  );
  expect(
    getPersistentReferralDraft({
      ...scope,
      userId: 'another-user',
    }).getSnapshot(),
  ).toBeNull();
});

// This restart test reloads the real storage adapter twice. Allow cold native
// module transformation on a fresh checkout without overlapping the next test.
it('preserves several client drafts across restarts without mixing accounts, organizations or environments', async () => {
  const { getPersistentReferralDraft } = await import('./referralDraftStorage');
  const store = getPersistentReferralDraft(scope);
  expect(getPersistentReferralDraft(scope)).toBe(store);
  store.startNew(scope.clientId);
  store.setField('notes', 'First client');
  store.setStep('picker');
  store.setShelter('s-2');
  const other = getPersistentReferralDraft({ ...scope, clientId: 'client-2' });
  other.startNew('client-2');
  other.setField('notes', 'Second client');
  for (const change of [
    { userId: 'user-2' },
    { organizationId: 'org-2' },
    { apiUrl: 'https://staging/graphql' },
  ]) {
    expect(
      getPersistentReferralDraft({ ...scope, ...change }).getSnapshot(),
    ).toBeNull();
  }
  endReferralDraftSession();
  const restored = (await import('./referralDraftStorage'))
    .getPersistentReferralDraft;
  expect(restored(scope).getSnapshot()).toMatchObject({
    answers: { notes: 'First client' },
    step: 'picker',
    selectedShelterId: 's-2',
  });
  expect(
    restored({ ...scope, clientId: 'client-2' }).getSnapshot()?.answers.notes,
  ).toBe('Second client');
  restored(scope).clear();
  expect(
    restored({ ...scope, clientId: 'client-2' }).getSnapshot()?.answers.notes,
  ).toBe('Second client');
}, 15_000);

it('recovers a legacy draft only by explicit request for its client and never overwrites an existing draft', async () => {
  const legacy = {
    clientId: 'client-1',
    step: 'intake',
    fields: { notes: 'Older draft' },
    pii: {},
    selectedShelterId: null,
    updatedAt: 1,
  };
  stores.set('referral-draft', new Map([['draft', JSON.stringify(legacy)]]));
  const {
    getPersistentReferralDraft,
    hasLegacyReferralDraft,
    recoverLegacyReferralDraft,
  } = await import('./referralDraftStorage');
  expect(getPersistentReferralDraft(scope).getSnapshot()).toBeNull();
  expect(hasLegacyReferralDraft('client-2')).toBe(false);
  expect(recoverLegacyReferralDraft({ ...scope, clientId: 'client-2' })).toBe(
    false,
  );
  getPersistentReferralDraft(scope).startNew(scope.clientId);
  expect(recoverLegacyReferralDraft(scope)).toBe(false);
  getPersistentReferralDraft(scope).clear();
  expect(recoverLegacyReferralDraft(scope)).toBe(true);
  expect(getPersistentReferralDraft(scope).getSnapshot()?.answers.notes).toBe(
    'Older draft',
  );
  expect(stores.get('referral-draft')?.has('draft')).toBe(false);
});

it('rejects an incomplete scope or a cross-client write', async () => {
  const { getPersistentReferralDraft } = await import('./referralDraftStorage');
  expect(() => getPersistentReferralDraft({ ...scope, userId: '' })).toThrow();
  const store = getPersistentReferralDraft(scope);
  expect(() => store.startNew('client-2')).toThrow('client mismatch');
  expect(store.getSnapshot()).toBeNull();
});

it('isolates malformed JSON and mismatched client data without overwriting either', async () => {
  const key = JSON.stringify(Object.values(scope));
  stores.set('referral-drafts-v2', new Map([[key, '{bad JSON']]));
  const { getPersistentReferralDraft, recoverLegacyReferralDraft } =
    await import('./referralDraftStorage');
  const store = getPersistentReferralDraft(scope);
  expect(store.getRecoveryState()).toBe('unreadable');
  expect(store.startNew(scope.clientId)).toBe(false);
  expect(recoverLegacyReferralDraft(scope)).toBe(false);
  expect(stores.get('referral-drafts-v2')?.get(key)).toBe('{bad JSON');
  stores
    .get('referral-drafts-v2')
    ?.set(key, JSON.stringify({ clientId: 'someone-else' }));
  store.retryLoad();
  expect(store.getSnapshot()).toBeNull();
  expect(store.getRecoveryState()).not.toBeNull();
});

it('releases only the departed session and restores its drafts on return', async () => {
  const { getPersistentReferralDraft, releaseReferralDraftSession } =
    await import('./referralDraftStorage');
  const original = getPersistentReferralDraft(scope);
  original.startNew(scope.clientId);
  original.setField('notes', 'First organization');
  const next = getPersistentReferralDraft({
    ...scope,
    organizationId: 'org-2',
  });
  next.startNew(scope.clientId);
  next.setField('notes', 'Second organization');
  releaseReferralDraftSession(scope);
  expect(original.getSnapshot()).toBeNull();
  expect(original.startNew(scope.clientId)).toBe(false);
  expect(next.getSnapshot()?.answers.notes).toBe('Second organization');
  expect(getPersistentReferralDraft(scope).getSnapshot()?.answers.notes).toBe(
    'First organization',
  );
});

it('removes only the selected account and API, including unopened/corrupted drafts across organizations', async () => {
  let adapter = await import('./referralDraftStorage');
  for (const change of [
    {},
    { clientId: 'client-2' },
    { organizationId: 'org-2' },
    { userId: 'user-2' },
    { apiUrl: 'https://other-api' },
  ]) {
    const target = { ...scope, ...change };
    adapter.getPersistentReferralDraft(target).startNew(target.clientId);
  }
  const corruptKey = JSON.stringify([
    scope.apiUrl,
    scope.userId,
    'org-3',
    'client-3',
  ]);
  stores.get('referral-drafts-v2')?.set(corruptKey, '{bad');
  endReferralDraftSession(); // unopened drafts must also be removed
  adapter = await import('./referralDraftStorage');
  const old = adapter.getPersistentReferralDraft(scope);
  adapter.discardAccountReferralDrafts(scope);
  expect(old.getSnapshot()).toBeNull();
  expect(old.startNew(scope.clientId)).toBe(false);
  expect(stores.get('referral-drafts-v2')?.size).toBe(2);
  expect(
    adapter
      .getPersistentReferralDraft({ ...scope, userId: 'user-2' })
      .getSnapshot(),
  ).not.toBeNull();
  expect(
    adapter
      .getPersistentReferralDraft({ ...scope, apiUrl: 'https://other-api' })
      .getSnapshot(),
  ).not.toBeNull();
  expect(adapter.getPersistentReferralDraft(scope).getSnapshot()).toBeNull();
});
