import { PetChoices } from '../../../../apollo';
import {
  INTAKE_FIELDS,
  getIntakeField,
  isIntakeFieldValue,
} from '../../../../draft/intakeFields';
import { prepareIntakeReuse } from './intakeReuse';
import {
  buildReferralNotes,
  decodeReferralNotes,
} from '../shared/referralIntakeSidecar';

describe('referral answer reuse', () => {
  it('prefills stable answers, identifies review items, and resets referral-specific answers', () => {
    const original = Object.freeze({
      pets: Object.freeze([PetChoices.Cats]),
      selfcare: 'No',
      substances: 'Three days',
      requestedArrivalDate: '2026-09-08',
      consent: true,
      notes: 'Only for the first shelter',
    });
    const result = prepareIntakeReuse(original);
    expect(result.values).toEqual({
      pets: [PetChoices.Cats],
      selfcare: 'No',
      substances: 'Three days',
      requestedArrivalDate: '2026-09-08',
    });
    expect(result.reviewKeys).toEqual(
      expect.arrayContaining([
        'selfcare',
        'substances',
        'requestedArrivalDate',
      ]),
    );
    expect(result.reviewKeys).not.toContain('pets');
    expect(result.skippedKeys).toEqual([]);
    expect(result.values.pets).not.toBe(original.pets);
    expect(original.consent).toBe(true);
    expect(original.notes).toBe('Only for the first shelter');
  });

  it('retains valid choices and flags retired or unknown answers without carrying them into a new referral', () => {
    const result = prepareIntakeReuse({
      pets: [PetChoices.Cats, 'RETIRED_OPTION'],
      selfcare: 'MAYBE',
      futureField: 'Unsupported answer',
    });
    expect(result.values).toEqual({ pets: [PetChoices.Cats] });
    expect(result.skippedKeys).toEqual(['pets', 'selfcare', 'futureField']);
    expect(result.reviewKeys).toEqual(
      expect.arrayContaining(['pets', 'selfcare']),
    );
  });

  it('converts a recognized legacy single choice and boolean answer and requires review', () => {
    const result = prepareIntakeReuse({
      pets: PetChoices.Cats,
      selfcare: false,
    });
    expect(result.values).toEqual({ pets: [PetChoices.Cats], selfcare: 'No' });
    expect(result.reviewKeys).toEqual(
      expect.arrayContaining(['pets', 'selfcare']),
    );
    expect(result.skippedKeys).toEqual([]);
  });

  it('uses the definition policy rather than hardcoded field identities', () => {
    const definitions = INTAKE_FIELDS.map((field) => {
      if (field.key === 'pets') return { ...field, reuse: 'reset' as const };
      return field;
    });
    expect(
      prepareIntakeReuse({ pets: [PetChoices.Cats] }, definitions).values,
    ).toEqual({});
  });
});

describe('requested arrival date contract', () => {
  it.each(['2026-09-08', '2028-02-29', ''])(
    'accepts the date-only value %s',
    (value) => {
      expect(isIntakeFieldValue('requestedArrivalDate', value)).toBe(true);
    },
  );

  it.each([
    '2026-02-29',
    '2026-04-31',
    '09/08/2026',
    '2026-09-08T00:00:00Z',
    42,
  ])(
    'rejects an invalid calendar date or another representation: %s',
    (value) =>
      expect(isIntakeFieldValue('requestedArrivalDate', value)).toBe(false),
  );

  it('keeps a requested date separate from creation metadata through the notes bridge', () => {
    const field = getIntakeField('requestedArrivalDate');
    expect(field).toMatchObject({
      control: 'date',
      reuse: 'review',
      requirement: 'optional',
    });
    const notes = buildReferralNotes({ requestedArrivalDate: '2026-09-08' });
    expect(decodeReferralNotes(notes).intake).toEqual({
      requestedArrivalDate: '2026-09-08',
    });
    expect(notes).not.toContain('createdAt');
  });
});
