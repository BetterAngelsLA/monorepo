import { randomUUID } from 'node:crypto';
import { createReferralDraftStore } from './referralDraft';
import { referralDraftSeed } from './referralDraftSeed';
import {
  buildReferralNotes,
  canEditReferralNotes,
  decodeReferralNotes,
  updateReferralNotes,
} from './referralIntakeSidecar';

const source = {
  id: 'old-referral',
  shelter: { id: 's-1' },
  notes:
    'Original human note\n\n<<<referral-intake:v1>>>\n' +
    JSON.stringify({
      v: 1,
      extension: { preserve: true },
      fields: {
        pets: ['CATS', 'RETIRED'],
        requestedArrivalDate: '2026-09-09',
        futureField: ['keep'],
      },
      PII: {
        substances: '30 days',
        selfcare: 'No',
        consent: true,
        futureSensitive: { keep: 'private' },
      },
    }) +
    '\n<<<end-referral-intake>>>\nExtra human text',
};

it('starts an independent new referral, flags schema drift and resets shelter, consent and notes', () => {
  const seed = referralDraftSeed(source, 'reuse');
  expect(seed).toMatchObject({
    selectedShelterId: null,
    source: {
      kind: 'reuse',
      referralId: 'old-referral',
      reviewKeys: expect.arrayContaining(['pets', 'requestedArrivalDate']),
      skippedKeys: expect.arrayContaining([
        'pets',
        'futureField',
        'futureSensitive',
      ]),
    },
    values: {
      pets: ['CATS'],
      requestedArrivalDate: '2026-09-09',
      substances: '30 days',
      selfcare: 'No',
    },
  });
  expect(seed?.values).not.toHaveProperty('consent');
  expect(seed?.values).not.toHaveProperty('notes');
  expect(seed?.values).not.toHaveProperty('futureField');
  expect(source.notes).toContain('Original human note');
});

it('edits recognized values while preserving unknown fields in their original buckets and unknown metadata', () => {
  const seed = referralDraftSeed(source, 'edit');
  if (!seed) throw new Error('Expected editable source');
  const store = createReferralDraftStore(
    { load: () => null, save: vi.fn(), remove: vi.fn() },
    randomUUID,
  );
  store.startNew('client-1', seed);
  store.setField('requestedArrivalDate', '2026-09-10');
  store.setField('substances', '');
  const updated = updateReferralNotes(
    source.notes,
    store.getSnapshot()?.storedValues ?? {},
  );
  expect(decodeReferralNotes(updated)).toMatchObject({
    humanNotes: 'Original human note\nExtra human text',
    intake: {
      requestedArrivalDate: '2026-09-10',
      pets: ['CATS', 'RETIRED'],
      futureField: ['keep'],
      futureSensitive: { keep: 'private' },
    },
  });
  expect(decodeReferralNotes(updated).intake).not.toHaveProperty('substances');
  const payload = JSON.parse(
    updated
      .split('<<<referral-intake:v1>>>\n')[1]
      .split('\n<<<end-referral-intake>>>')[0],
  );
  expect(payload).toMatchObject({
    extension: { preserve: true },
    PII: { futureSensitive: { keep: 'private' } },
  });
  expect(payload.fields).not.toHaveProperty('futureSensitive');
  expect(decodeReferralNotes(source.notes).intake.requestedArrivalDate).toBe(
    '2026-09-09',
  );
});

it('can edit plain notes into a referral with intake and can clear a known value', () => {
  const updated = updateReferralNotes('Original', {
    notes: 'New note',
    requestedArrivalDate: '2026-09-10',
  });
  expect(decodeReferralNotes(updated)).toEqual({
    humanNotes: 'New note',
    intake: { requestedArrivalDate: '2026-09-10' },
  });
  expect(
    decodeReferralNotes(
      updateReferralNotes(updated, { requestedArrivalDate: '' }),
    ).intake,
  ).toEqual({});
  expect(buildReferralNotes({ notes: 'New note' })).toBe('New note');
});

it.each([
  'Notes\n\n<<<referral-intake:v2>>>\n{}\n<<<end-referral-intake>>>',
  'Notes\n\n<<<referral-intake:v1>>>\ninvalid\n<<<end-referral-intake>>>',
  'Notes\n\n<<<referral-intake:v1>>>\n{"v":1,"fields":[] }\n<<<end-referral-intake>>>',
  'Notes\n\n<<<referral-intake:v1>>>\n{"v":1}',
])('refuses to overwrite an unreadable/future payload: %s', (notes) => {
  expect(canEditReferralNotes(notes)).toBe(false);
  expect(referralDraftSeed({ ...source, notes }, 'edit')).toBeNull();
  expect(() => updateReferralNotes(notes, { notes: 'Replacement' })).toThrow(
    'unsupported',
  );
});
