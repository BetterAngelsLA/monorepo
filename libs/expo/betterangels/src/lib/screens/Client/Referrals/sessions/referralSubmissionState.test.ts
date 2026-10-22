import { randomUUID } from 'node:crypto';
import {
  createReferralDraftStore,
  type DraftPersistence,
} from '../../../../draft/referralDraft';
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Expected a test value');
  return value;
}

function setup() {
  let saved: unknown = null;
  const persistence: DraftPersistence = {
    load: () => saved,
    save: (draft) => {
      saved = JSON.parse(JSON.stringify(draft));
    },
    remove: () => {
      saved = null;
    },
  };
  const store = createReferralDraftStore(persistence, randomUUID);
  store.startNew('client-1');
  store.setField('notes', 'First referral');
  store.setShelter('s-1');
  return {
    store,
    persistence,
    reload: () => createReferralDraftStore(persistence, randomUUID),
  };
}

it('locks one submitted snapshot across subscribers and prevents another operation for the same draft', () => {
  const { store } = setup();
  const id = required(store.getSnapshot()).id;
  const attempt = store.beginSubmission(id);
  expect(attempt?.draft.answers.notes).toBe('First referral');
  expect(store.getSnapshot()?.submission.status).toBe('pending');
  expect(store.beginSubmission(id)).toBeNull();
  expect(store.setField('notes', 'Changed while sending')).toBe(false);
  expect(store.setShelter('s-2')).toBe(false);
  expect(store.clear(id)).toBe(false);
  expect(store.startNew('client-2')).toBe(false);
  expect(attempt?.draft.answers.notes).toBe('First referral');
});

it('a rejected request permits retry, but an old response cannot finish the newer attempt', () => {
  const { store } = setup();
  const id = required(store.getSnapshot()).id;
  const first = required(store.beginSubmission(id));
  expect(store.finishSubmission(first, 'rejected')).toBe(true);
  const retry = required(store.beginSubmission(id));
  expect(retry.attemptId).not.toBe(first.attemptId);
  expect(store.finishSubmission(first, 'success')).toBe(false);
  expect(store.getSnapshot()?.submission.status).toBe('pending');
  expect(store.finishSubmission(retry, 'success')).toBe(true);
  expect(store.getSnapshot()).toBeNull();
});

it('does not consume a replacement draft after the previous operation already finished', () => {
  const { store } = setup();
  const oldId = required(store.getSnapshot()).id;
  const first = required(store.beginSubmission(oldId));
  store.finishSubmission(first, 'success');
  store.startNew('client-1');
  store.setField('notes', 'Second referral');
  const replacement = store.getSnapshot();
  expect(replacement?.id).not.toBe(oldId);
  expect(store.finishSubmission(first, 'success')).toBe(false);
  expect(store.clear(oldId)).toBe(false);
  expect(store.getSnapshot()).toBe(replacement);
});

it('restores an interrupted request as uncertain and requires explicit review before retry', () => {
  const { store, reload } = setup();
  const id = required(store.getSnapshot()).id;
  store.beginSubmission(id);
  const restored = reload();
  expect(restored.getSnapshot()).toMatchObject({
    id,
    answers: { notes: 'First referral' },
    submission: { status: 'uncertain' },
  });
  expect(restored.beginSubmission(id)).toBeNull();
  expect(restored.acknowledgeUncertainSubmission(id)).toBe(true);
  expect(restored.beginSubmission(id)).not.toBeNull();
});

it('requires explicit review of an ambiguous network outcome without discarding answers', () => {
  const { store } = setup();
  const id = required(store.getSnapshot()).id;
  const attempt = required(store.beginSubmission(id));
  store.finishSubmission(attempt, 'uncertain');
  expect(store.getSnapshot()?.answers.notes).toBe('First referral');
  expect(store.beginSubmission(id)).toBeNull();
  expect(store.acknowledgeUncertainSubmission('another-draft')).toBe(false);
  expect(store.acknowledgeUncertainSubmission(id)).toBe(true);
  expect(store.beginSubmission(id)).not.toBeNull();
});

it('does not start an operation if its pending state cannot be persisted', () => {
  const { store, persistence } = setup();
  const before = required(store.getSnapshot());
  persistence.save = () => {
    throw new Error('Disk full');
  };
  expect(() => store.beginSubmission(before.id)).toThrow('Disk full');
  expect(store.getSnapshot()).toBe(before);
  expect(before.submission.status).toBe('idle');
});

it('does not permit another send when the server succeeded but local cleanup failed', () => {
  const { store, persistence } = setup();
  const id = required(store.getSnapshot()).id;
  const attempt = required(store.beginSubmission(id));
  persistence.remove = () => {
    throw new Error('Storage unavailable');
  };
  expect(() => store.finishSubmission(attempt, 'success')).toThrow(
    'Storage unavailable',
  );
  expect(store.getSnapshot()?.submission.status).toBe('saved');
  expect(store.beginSubmission(id)).toBeNull();
  expect(store.setField('notes', 'Send again')).toBe(false);
  persistence.remove = () => undefined;
  expect(store.clear(id)).toBe(true);
});
