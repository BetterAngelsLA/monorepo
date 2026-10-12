import {
  PetChoices,
  StorageChoices,
  SpecialSituationRestrictionChoices,
} from '../../../apollo';
import {
  createReferralDraftStore,
  type DraftPersistence,
  type ReferralDraft,
} from './referralDraft';
import type { IntakeFieldKey } from './intakeFields';
import {
  buildReferralNotes,
  decodeReferralNotes,
} from './referralIntakeSidecar';

const CLIENT = 'client-1';
const oldDraft = (
  fields: Record<string, unknown> = {},
  pii: Record<string, unknown> = {},
): ReferralDraft => ({
  clientId: CLIENT,
  step: 'intake',
  fields,
  pii,
  selectedShelterId: null,
  updatedAt: 1,
});

// JSON storage outlives each store instance, just as persisted data outlives the app.
function harness(initial: unknown = null) {
  let saved = JSON.stringify(initial);
  const persistence: DraftPersistence = {
    load: () => JSON.parse(saved),
    save: vi.fn((draft) => {
      saved = JSON.stringify(draft);
    }),
    remove: vi.fn(() => {
      saved = 'null';
    }),
  };
  return {
    persistence,
    store: createReferralDraftStore(persistence),
    reload: () => createReferralDraftStore(persistence),
  };
}

describe('validated draft access', () => {
  it('does not create a draft from a stray field write', () => {
    const { store, persistence } = harness();
    expect(store.setField('consent', true)).toBe(false);
    expect(store.getSnapshot()).toBeNull();
    expect(persistence.save).not.toHaveBeenCalled();
  });

  it('writes typed choices and separates sensitive answers using the catalog', () => {
    const { store } = harness();
    store.startNew(CLIENT);
    expect(store.setField('storage', [StorageChoices.AmnestyLockers])).toBe(
      true,
    );
    store.setField('substances', '30 days');
    store.setField('special', [
      SpecialSituationRestrictionChoices.DomesticViolence,
    ]);
    expect(store.getSnapshot()?.fields).toEqual({
      storage: ['AMNESTY_LOCKERS'],
    });
    expect(store.getSnapshot()?.pii).toEqual({
      substances: '30 days',
      special: ['DOMESTIC_VIOLENCE'],
    });
    expect(store.getField('storage')).toEqual(['AMNESTY_LOCKERS']);
    expect(store.setField('storage', store.getField('storage') ?? [])).toBe(
      true,
    );
    expectTypeOf(store.getField('pets')).toEqualTypeOf<
      readonly PetChoices[] | undefined
    >();
  });

  it('rejects incorrect key/value pairs statically and at runtime', () => {
    const { store } = harness();
    store.startNew(CLIENT);
    const before = store.getSnapshot();
    // @ts-expect-error Unknown field keys must not become draft fields.
    expect(store.setField('petz', [])).toBe(false);
    // @ts-expect-error A checkbox does not accept text.
    expect(store.setField('consent', 'Yes')).toBe(false);
    // @ts-expect-error Multiselect answers cannot be scalar strings.
    expect(store.setField('pets', 'CATS')).toBe(false);
    // @ts-expect-error Arbitrary strings are not generated enum values.
    expect(store.setField('pets', ['NOT_A_PET'])).toBe(false);
    const writeWithUnrelatedKey = (key: 'consent' | 'substances') => {
      // @ts-expect-error A union key does not guarantee that true is a valid value.
      return store.setField(key, true);
    };
    expect(writeWithUnrelatedKey('substances')).toBe(false);
    expect(store.getSnapshot()).toBe(before);
  });

  it.each<[IntakeFieldKey, unknown]>([
    ['pets', ['CATS', 'RETIRED']],
    ['storage', 'Yes'],
    ['special', 42],
    ['selfcare', 'Maybe'],
    ['consent', 'true'],
    ['notes', {}],
    ['pets', undefined],
  ])(
    'rejects invalid dynamic control input for %s without notifying or persisting',
    (key, value) => {
      const { store, persistence } = harness();
      store.startNew(CLIENT);
      const before = store.getSnapshot();
      const listener = vi.fn();
      store.subscribe(listener);
      vi.mocked(persistence.save).mockClear();
      expect(store.setControlValue(key, value)).toBe(false);
      expect(store.getSnapshot()).toBe(before);
      expect(listener).not.toHaveBeenCalled();
      expect(persistence.save).not.toHaveBeenCalled();
    },
  );

  it('accepts clearing controls and a negative yes/no answer', () => {
    const { store } = harness();
    store.startNew(CLIENT);
    store.setField('pets', [PetChoices.Cats]);
    store.setField('pets', []);
    store.setField('notes', '');
    store.setField('consent', false);
    store.setField('selfcare', 'No');
    expect(store.getSnapshot()?.answers).toEqual({
      pets: [],
      notes: '',
      consent: false,
      selfcare: 'No',
    });
  });
});

describe('legacy persistence boundary', () => {
  it('preserves older answers while exposing only current valid values to controls', () => {
    const fields = {
      storage: 'Yes',
      pets: ['RETIRED_VALUE', 'CATS'],
      futureField: { nested: ['legacy'] },
    };
    const { store, persistence, reload } = harness(
      oldDraft(fields, { substances: '30 days' }),
    );
    expect(store.getField('storage')).toBeUndefined();
    expect(store.getField('pets')).toEqual(['CATS']);
    expect(store.getSnapshot()?.storedValues).toEqual({
      ...fields,
      substances: '30 days',
    });
    expect(persistence.save).not.toHaveBeenCalled();
    const notes = buildReferralNotes(store.getSnapshot()?.storedValues ?? {});
    expect(decodeReferralNotes(notes).intake).toEqual({
      ...fields,
      substances: '30 days',
    });

    store.setField('pets', [PetChoices.ServiceAnimals]);
    expect(reload().getSnapshot()?.storedValues).toEqual({
      ...fields,
      pets: ['SERVICE_ANIMALS'],
      substances: '30 days',
    });
  });

  it('moves an edited answer out of its old sensitivity bucket', () => {
    const { store, reload } = harness(
      oldDraft({ substances: 'old' }, { storage: ['AMNESTY_LOCKERS'] }),
    );
    store.setField('substances', 'updated');
    store.setField('storage', []);
    expect(reload().getSnapshot()?.fields).toEqual({ storage: [] });
    expect(reload().getSnapshot()?.pii).toEqual({ substances: 'updated' });
  });

  it('persists answers, step, and selection without adding derived data to the wire format', () => {
    const { store, persistence, reload } = harness();
    store.startNew(CLIENT);
    store.setField('pets', [PetChoices.Cats]);
    store.setStep('picker');
    store.setShelter('s-7');
    expect(reload().getSnapshot()).toMatchObject({
      clientId: CLIENT,
      step: 'picker',
      selectedShelterId: 's-7',
      answers: { pets: ['CATS'] },
    });
    expect(Object.keys(persistence.load() as object).sort()).toEqual([
      'clientId',
      'fields',
      'pii',
      'selectedShelterId',
      'step',
      'updatedAt',
    ]);
    store.clear();
    expect(reload().getSnapshot()).toBeNull();
  });

  it('does not replace a draft with an empty client identity', () => {
    const { store } = harness(oldDraft({ notes: 'Keep this' }));
    const before = store.getSnapshot();
    store.startNew('');
    expect(store.getSnapshot()).toBe(before);
  });

  it('keeps one draft per store and replaces it on startNew', () => {
    const { store } = harness(oldDraft({ notes: 'Old' }));
    store.startNew('client-2');
    expect(store.getSnapshot()).toMatchObject({
      clientId: 'client-2',
      step: 'intake',
      storedValues: {},
      selectedShelterId: null,
    });
  });

  it.each([
    42,
    [],
    { ...oldDraft(), fields: [] },
    { ...oldDraft(), step: 'bogus' },
  ])('does not expose or overwrite an invalid stored envelope', (initial) => {
    const { store, persistence } = harness(initial);
    expect(store.getSnapshot()).toBeNull();
    expect(persistence.save).not.toHaveBeenCalled();
    expect(persistence.remove).not.toHaveBeenCalled();
  });
});

describe('snapshot ownership and subscriptions', () => {
  it('keeps stable snapshots until a successful change and respects unsubscribe', () => {
    const { store } = harness();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.startNew(CLIENT);
    const first = store.getSnapshot();
    expect(store.getSnapshot()).toBe(first);
    store.setField('consent', true);
    expect(store.getSnapshot()).not.toBe(first);
    expect(first?.answers.consent).toBeUndefined();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.clear();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('does not expose mutable arrays or nested legacy objects', () => {
    const initial = oldDraft({ futureField: { nested: ['legacy'] } });
    const { store } = harness(initial);
    const pets = [PetChoices.Cats];
    store.setField('pets', pets);
    pets.push(PetChoices.ServiceAnimals);
    expect(store.getField('pets')).toEqual(['CATS']);
    expect(() => {
      // @ts-expect-error Typed reads are readonly, and runtime mutation is blocked too.
      store.getField('pets')?.push(PetChoices.ServiceAnimals);
    }).toThrow();
    const nested = store.getSnapshot()?.storedValues.futureField;
    expect(Object.isFrozen(nested)).toBe(true);
    expect(Object.isFrozen(store.getSnapshot()?.fields.pets)).toBe(true);
    const snapshot = store.getSnapshot();
    if (!snapshot) throw new Error('Expected a draft snapshot');
    expect(() => {
      // @ts-expect-error A snapshot cannot be edited in place.
      snapshot.step = 'picker';
    }).toThrow();
    expect(store.getSnapshot()?.step).toBe('intake');
  });

  it('does not publish a changed answer if persistence fails', () => {
    const { store, persistence } = harness(oldDraft({ consent: false }));
    const before = store.getSnapshot();
    const listener = vi.fn();
    store.subscribe(listener);
    vi.mocked(persistence.save).mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    expect(() => store.setField('consent', true)).toThrow(
      'Storage unavailable',
    );
    expect(store.getSnapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });
});
