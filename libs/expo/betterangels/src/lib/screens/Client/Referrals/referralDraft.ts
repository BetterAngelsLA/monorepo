import {
  getIntakeField,
  isIntakeFieldValue,
  readIntakeAnswers,
  type IntakeAnswers,
  type IntakeFieldKey,
  type IntakeFieldWrite,
  type StoredIntake,
} from './intakeFields';

/** Existing on-device format. Sensitive buckets are separate, not encrypted. */
export type ReferralDraft = Readonly<{
  clientId: string;
  step: 'intake' | 'picker';
  fields: Readonly<StoredIntake>;
  pii: Readonly<StoredIntake>;
  selectedShelterId: string | null;
  updatedAt: number;
}>;

export type ReferralDraftSnapshot = ReferralDraft &
  Readonly<{
    // Preserve legacy/unknown answers for submission; controls use typed answers.
    storedValues: Readonly<StoredIntake>;
    answers: IntakeAnswers;
  }>;

export type DraftPersistence = {
  load: () => unknown;
  save: (draft: ReferralDraft) => void;
  remove: () => void;
};

function isRecord(value: unknown): value is StoredIntake {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Persisted data is JSON. Copy/freeze nested legacy values as well as new arrays,
// so neither callers nor a persistence adapter can mutate a published snapshot.
function immutableValue(value: unknown): unknown {
  if (Array.isArray(value)) return Object.freeze(value.map(immutableValue));
  if (isRecord(value)) return immutableRecord(value);
  return value;
}

function immutableRecord(
  values: Readonly<StoredIntake>,
): Readonly<StoredIntake> {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        immutableValue(value),
      ]),
    ),
  );
}

function readPersistedDraft(value: unknown): ReferralDraft | null {
  if (
    !isRecord(value) ||
    typeof value.clientId !== 'string' ||
    !value.clientId ||
    (value.step !== 'intake' && value.step !== 'picker') ||
    !isRecord(value.fields) ||
    !isRecord(value.pii) ||
    (value.selectedShelterId !== null &&
      typeof value.selectedShelterId !== 'string') ||
    typeof value.updatedAt !== 'number' ||
    !Number.isFinite(value.updatedAt)
  )
    return null;
  return {
    clientId: value.clientId,
    step: value.step,
    fields: value.fields,
    pii: value.pii,
    selectedShelterId: value.selectedShelterId,
    updatedAt: value.updatedAt,
  };
}

function makeSnapshot(
  draft: ReferralDraft | null,
): ReferralDraftSnapshot | null {
  if (!draft) return null;
  const fields = immutableRecord(draft.fields);
  const pii = immutableRecord(draft.pii);
  const storedValues = Object.freeze({ ...fields, ...pii });
  return Object.freeze({
    ...draft,
    fields,
    pii,
    storedValues,
    answers: readIntakeAnswers(storedValues),
  });
}

/** One draft per store. React and MMKV are adapters, not store dependencies. */
export function createReferralDraftStore(persistence: DraftPersistence) {
  let snapshot = makeSnapshot(readPersistedDraft(persistence.load()));
  const listeners = new Set<() => void>();

  function commit(draft: ReferralDraft | null) {
    const next = makeSnapshot(draft);
    // Persist first: a failed write must not publish a successful UI update.
    if (next) {
      const { clientId, step, fields, pii, selectedShelterId, updatedAt } =
        next;
      persistence.save({
        clientId,
        step,
        fields,
        pii,
        selectedShelterId,
        updatedAt,
      });
    } else {
      persistence.remove();
    }
    snapshot = next;
    listeners.forEach((listener) => listener());
  }

  function setControlValue(key: IntakeFieldKey, value: unknown): boolean {
    if (!snapshot || !isIntakeFieldValue(key, value)) return false;
    const field = getIntakeField(key);
    if (!field?.persistence.localDraft) return false;
    const fields = { ...snapshot.fields };
    const pii = { ...snapshot.pii };
    delete fields[key];
    delete pii[key];
    const bucket = field.sensitive ? pii : fields;
    bucket[key] = value;
    commit({ ...snapshot, fields, pii, updatedAt: Date.now() });
    return true;
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    // Stable until a successful write: suitable for useSyncExternalStore.
    getSnapshot: () => snapshot,
    getField<K extends IntakeFieldKey>(key: K): IntakeAnswers[K] {
      return snapshot?.answers[key];
    },
    setField(...[key, value]: IntakeFieldWrite): boolean {
      return setControlValue(key, value);
    },
    // Dynamic form controls still cross the same validated write boundary.
    setControlValue,
    startNew(clientId: string) {
      if (typeof clientId !== 'string' || !clientId.trim()) return;
      commit({
        clientId,
        step: 'intake',
        fields: {},
        pii: {},
        selectedShelterId: null,
        updatedAt: Date.now(),
      });
    },
    clear() {
      commit(null);
    },
    setStep(step: ReferralDraft['step']) {
      if (!snapshot || (step !== 'intake' && step !== 'picker')) return;
      commit({ ...snapshot, step, updatedAt: Date.now() });
    },
    setShelter(selectedShelterId: string | null) {
      if (
        !snapshot ||
        (selectedShelterId !== null && typeof selectedShelterId !== 'string')
      )
        return;
      commit({ ...snapshot, selectedShelterId, updatedAt: Date.now() });
    },
  };
}

export type ReferralDraftStore = ReturnType<typeof createReferralDraftStore>;
