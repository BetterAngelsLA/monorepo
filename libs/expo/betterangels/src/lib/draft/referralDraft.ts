import {
  getIntakeField,
  isIntakeFieldValue,
  readIntakeAnswers,
  type IntakeAnswers,
  type IntakeFieldKey,
  type IntakeFieldWrite,
  type StoredIntake,
} from './intakeFields';

export type ReferralSubmission = Readonly<
  | { status: 'idle' }
  | { status: 'pending' | 'uncertain' | 'saved'; attemptId: string }
>;

export type ReferralDraftSource = Readonly<
  | { kind: 'edit'; referralId: string; originalNotes: string }
  | {
      kind: 'reuse';
      referralId: string;
      reviewKeys: readonly string[];
      skippedKeys: readonly string[];
    }
>;
export type ReferralDraftSeed = Readonly<{
  source: ReferralDraftSource;
  values: Readonly<StoredIntake>;
  selectedShelterId: string | null;
}>;

/** On-device format. Sensitive buckets are separate, not encrypted. */
export type ReferralDraft = Readonly<{
  version?: 1;
  id: string;
  submission: ReferralSubmission;
  source?: ReferralDraftSource;
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

function readPersistedDraft(
  value: unknown,
  createId: () => string,
): ReferralDraft | null {
  if (
    !isRecord(value) ||
    (value.version !== undefined && value.version !== 1) ||
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
  let submission: ReferralSubmission = { status: 'idle' };
  if (value.submission !== undefined) {
    if (!isRecord(value.submission)) return null;
    if (value.submission.status !== 'idle') {
      if (
        !['pending', 'uncertain', 'saved'].includes(
          String(value.submission.status),
        ) ||
        typeof value.submission.attemptId !== 'string' ||
        !value.submission.attemptId
      )
        return null;
      // A restarted app cannot know whether an interrupted request reached the server.
      submission = {
        status: value.submission.status === 'saved' ? 'saved' : 'uncertain',
        attemptId: value.submission.attemptId,
      };
    }
  }
  if (value.id !== undefined && (typeof value.id !== 'string' || !value.id))
    return null;
  let source: ReferralDraftSource | undefined;
  if (value.source !== undefined) {
    const raw = value.source;
    if (!isRecord(raw) || typeof raw.referralId !== 'string' || !raw.referralId)
      return null;
    if (raw.kind === 'edit' && typeof raw.originalNotes === 'string') {
      source = {
        kind: 'edit',
        referralId: raw.referralId,
        originalNotes: raw.originalNotes,
      };
    } else if (
      raw.kind === 'reuse' &&
      Array.isArray(raw.reviewKeys) &&
      raw.reviewKeys.every((key) => typeof key === 'string') &&
      Array.isArray(raw.skippedKeys) &&
      raw.skippedKeys.every((key) => typeof key === 'string')
    ) {
      source = {
        kind: 'reuse',
        referralId: raw.referralId,
        reviewKeys: raw.reviewKeys,
        skippedKeys: raw.skippedKeys,
      };
    } else return null;
  }
  return {
    id: typeof value.id === 'string' ? value.id : createId(),
    submission,
    ...(source ? { source } : {}),
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
    submission: Object.freeze({ ...draft.submission }),
    ...(draft.source
      ? {
          source: Object.freeze(
            draft.source.kind === 'edit'
              ? { ...draft.source }
              : {
                  ...draft.source,
                  reviewKeys: Object.freeze([...draft.source.reviewKeys]),
                  skippedKeys: Object.freeze([...draft.source.skippedKeys]),
                },
          ),
        }
      : {}),
    fields,
    pii,
    storedValues,
    answers: readIntakeAnswers(storedValues),
  });
}

export type ReferralSubmissionAttempt = Readonly<{
  draftId: string;
  attemptId: string;
  draft: ReferralDraftSnapshot;
}>;

/** One draft per store. React and MMKV are adapters, not store dependencies. */
export function createReferralDraftStore(
  persistence: DraftPersistence,
  createId: () => string,
) {
  let active = true;
  let recovery: 'unreadable' | 'read-error' | null = null;
  let snapshot: ReferralDraftSnapshot | null = null;
  const listeners = new Set<() => void>();

  function load() {
    try {
      const value = persistence.load();
      snapshot = makeSnapshot(readPersistedDraft(value, createId));
      recovery = value != null && !snapshot ? 'unreadable' : null;
    } catch (error) {
      snapshot = null;
      recovery = error instanceof SyntaxError ? 'unreadable' : 'read-error';
    }
  }
  load();

  function commit(draft: ReferralDraft | null) {
    const next = makeSnapshot(draft);
    // Persist first: a failed write must not publish a successful UI update.
    if (next) {
      const {
        id,
        submission,
        source,
        clientId,
        step,
        fields,
        pii,
        selectedShelterId,
        updatedAt,
      } = next;
      persistence.save({
        version: 1,
        id,
        submission,
        ...(source ? { source } : {}),
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
    if (
      !snapshot ||
      snapshot.submission.status !== 'idle' ||
      !isIntakeFieldValue(key, value)
    )
      return false;
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
    getRecoveryState: () => recovery,
    retryLoad() {
      if (!active || !recovery) return false;
      load();
      listeners.forEach((listener) => listener());
      return recovery === null;
    },
    discardUnreadable() {
      if (!active || !recovery) return false;
      // Explicit user action only. If removal fails, keep the recovery state.
      persistence.remove();
      recovery = null;
      listeners.forEach((listener) => listener());
      return true;
    },
    release() {
      // Session boundaries revoke old forms/callbacks without deleting disk data.
      active = false;
      snapshot = null;
      recovery = null;
      listeners.forEach((listener) => listener());
    },
    getField<K extends IntakeFieldKey>(key: K): IntakeAnswers[K] {
      return snapshot?.answers[key];
    },
    setField(...[key, value]: IntakeFieldWrite): boolean {
      return setControlValue(key, value);
    },
    // Dynamic form controls still cross the same validated write boundary.
    setControlValue,
    startNew(clientId: string, seed?: ReferralDraftSeed) {
      if (
        !active ||
        recovery ||
        snapshot?.submission.status === 'pending' ||
        typeof clientId !== 'string' ||
        !clientId.trim()
      )
        return false;
      const fields: StoredIntake = {};
      const pii: StoredIntake = {};
      for (const [key, value] of Object.entries(seed?.values ?? {})) {
        (getIntakeField(key)?.sensitive ? pii : fields)[key] = value;
      }
      commit({
        id: createId(),
        submission: { status: 'idle' },
        ...(seed ? { source: seed.source } : {}),
        clientId,
        step: 'intake',
        fields,
        pii,
        selectedShelterId: seed?.selectedShelterId ?? null,
        updatedAt: Date.now(),
      });
      return true;
    },
    clear(expectedId?: string) {
      if (
        !snapshot ||
        snapshot.submission.status === 'pending' ||
        (expectedId !== undefined && snapshot.id !== expectedId)
      )
        return false;
      commit(null);
      return true;
    },
    beginSubmission(draftId: string): ReferralSubmissionAttempt | null {
      if (
        !snapshot ||
        snapshot.id !== draftId ||
        snapshot.submission.status !== 'idle'
      )
        return null;
      const attempt = Object.freeze({
        draftId,
        attemptId: createId(),
        draft: snapshot,
      });
      commit({
        ...snapshot,
        submission: { status: 'pending', attemptId: attempt.attemptId },
      });
      return attempt;
    },
    finishSubmission(
      attempt: ReferralSubmissionAttempt,
      outcome: 'success' | 'rejected' | 'uncertain',
    ): boolean {
      if (
        !snapshot ||
        snapshot.id !== attempt.draftId ||
        snapshot.submission.status !== 'pending' ||
        snapshot.submission.attemptId !== attempt.attemptId
      )
        return false;
      if (outcome === 'success') {
        try {
          commit(null);
        } catch (error) {
          // Server success is authoritative even if local cleanup fails. Keep a
          // terminal state in memory so the same operation cannot be sent again.
          snapshot = makeSnapshot({
            ...snapshot,
            submission: { status: 'saved', attemptId: attempt.attemptId },
          });
          listeners.forEach((listener) => listener());
          throw error;
        }
      } else {
        try {
          commit({
            ...snapshot,
            submission:
              outcome === 'rejected'
                ? { status: 'idle' }
                : { status: 'uncertain', attemptId: attempt.attemptId },
          });
        } catch (error) {
          // The request has finished, even though its result could not be saved
          // locally. Require an explicit check/retry instead of remaining stuck
          // as pending. The persisted pending record also recovers as uncertain.
          snapshot = makeSnapshot({
            ...snapshot,
            submission: { status: 'uncertain', attemptId: attempt.attemptId },
          });
          listeners.forEach((listener) => listener());
          throw error;
        }
      }
      return true;
    },
    acknowledgeUncertainSubmission(draftId: string): boolean {
      if (
        !snapshot ||
        snapshot.id !== draftId ||
        snapshot.submission.status !== 'uncertain'
      )
        return false;
      commit({ ...snapshot, submission: { status: 'idle' } });
      return true;
    },
    setStep(step: ReferralDraft['step']) {
      if (
        !snapshot ||
        snapshot.submission.status !== 'idle' ||
        (step !== 'intake' && step !== 'picker')
      )
        return false;
      commit({ ...snapshot, step, updatedAt: Date.now() });
      return true;
    },
    setShelter(selectedShelterId: string | null) {
      if (
        !snapshot ||
        snapshot.submission.status !== 'idle' ||
        (selectedShelterId !== null && typeof selectedShelterId !== 'string')
      )
        return false;
      commit({ ...snapshot, selectedShelterId, updatedAt: Date.now() });
      return true;
    },
  };
}

export type ReferralDraftStore = ReturnType<typeof createReferralDraftStore>;
