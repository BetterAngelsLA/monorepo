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
      getString: (key: string) => backing.get(key),
      set: (key: string, value: string) => backing.set(key, value),
      remove: (key: string) => backing.delete(key),
    };
  }),
}));

it('retains the existing MMKV scope/key and survives a module restart', async () => {
  stores.clear();
  vi.resetModules();
  const { getPersistentReferralDraft } = await import('./referralDraftStorage');
  const store = getPersistentReferralDraft();
  expect(getPersistentReferralDraft()).toBe(store);
  store.startNew('client-1');
  store.setField('substances', '30 days');
  store.setStep('picker');
  store.setShelter('s-2');
  expect(stores.size).toBe(1);
  const saved = stores.get('referral-draft')?.get('draft');
  if (saved === undefined) throw new Error('Expected a persisted draft');
  expect(JSON.parse(saved)).toMatchObject({
    fields: {},
    pii: { substances: '30 days' },
  });

  vi.resetModules();
  const reloaded = (
    await import('./referralDraftStorage')
  ).getPersistentReferralDraft();
  expect(reloaded.getSnapshot()).toMatchObject({
    clientId: 'client-1',
    step: 'picker',
    selectedShelterId: 's-2',
    answers: { substances: '30 days' },
  });
  reloaded.clear();
  expect(stores.get('referral-draft')?.has('draft')).toBe(false);
});
