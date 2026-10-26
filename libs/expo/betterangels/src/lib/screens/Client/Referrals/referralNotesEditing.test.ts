import { referralDraftSeed } from './referralDraftSeed';
import { buildReferralTextCopy } from './referralExport';
import {
  canEditReferralNotes,
  decodeReferralNotes,
  encodeReferralNotes,
  updateReferralNotes,
} from './referralIntakeSidecar';

const START = '\n\n<<<referral-intake:v1>>>\n';
const END = '\n<<<end-referral-intake>>>';

it('edits the last valid envelope without losing typed markers or foreign metadata', () => {
  const human = `A volunteer typed${START}this is ordinary prose.`;
  const original = `${human}${START}{"v":1,"source":"future-import","fields":{"storage":["AMNESTY_LOCKERS"],"future":{"nested":true},"__proto__":{"kept":true}},"PII":{"substances":"fictional"}}${END}`;
  expect(canEditReferralNotes(original)).toBe(true);
  const updated = updateReferralNotes(original, {
    storage: [],
    requestedArrivalDate: '2026-10-20',
  });
  const decoded = decodeReferralNotes(updated);
  expect(decoded.humanNotes).toBe(human);
  expect(decoded.intake).toMatchObject({
    future: { nested: true },
    substances: 'fictional',
    requestedArrivalDate: '2026-10-20',
  });
  expect(decoded.intake.storage).toBeUndefined();
  expect(
    Object.prototype.hasOwnProperty.call(decoded.intake, '__proto__'),
  ).toBe(true);
  expect(Object.getPrototypeOf(decoded.intake)).toBe(Object.prototype);
  expect(updated).toContain('"source":"future-import"');
});

it('allows reuse and export when human notes contain a literal marker', () => {
  const notes = encodeReferralNotes(`Typed${START}ordinary prose`, {
    selfcare: 'No',
  });
  const referral = {
    __typename: 'ReferralType' as const,
    id: 'fixture-1',
    createdAt: '2026-10-14T12:00:00Z',
    notes,
    shelter: null,
  };
  expect(referralDraftSeed(referral, 'edit')).not.toBeNull();
  expect(referralDraftSeed(referral, 'reuse')).not.toBeNull();
  expect(
    buildReferralTextCopy({
      referral,
      clientName: 'Fictional Client',
      generatedAt: '2026-10-14T12:00:00Z',
    }).text,
  ).toContain('Fictional Client');
});

it.each([
  `${START}{"v":2,"fields":{}}${END}`,
  `${START}{broken${END}`,
  `${START}{"v":1,"fields":{}}`,
  '<<<referral-intake:v2>>>future data',
])('refuses to overwrite an unreadable or future envelope: %s', (notes) => {
  expect(canEditReferralNotes(notes)).toBe(false);
  expect(() => updateReferralNotes(notes, { notes: 'replacement' })).toThrow();
});
