import {
  AdaAccommodationEnum,
  ReferralStatusEnum,
  VeteranStatusEnum,
} from '../../../apollo';
import type { ProfileCardData } from './ProfileCard';
import { INTAKE_FIELDS } from './intakeFields';
import { buildReferralTextCopy, type ExportReferral } from './referralExport';
import { encodeReferralNotes } from './referralIntakeSidecar';

const referral: ExportReferral = {
  __typename: 'ReferralType',
  id: 'r1',
  status: ReferralStatusEnum.Pending,
  createdAt: '2026-09-01T12:00:00Z',
  createdBy: {
    __typename: 'UserType',
    id: 'worker',
    firstName: 'A',
    lastName: 'Volunteer',
  },
  shelter: {
    __typename: 'ShelterType',
    id: 's1',
    name: 'Fictional Shelter',
    location: { __typename: 'ShelterLocationType', place: '123 Test St' },
    pets: [],
    demographics: [],
    accessibility: [],
  },
  notes: encodeReferralNotes('Private observation\nSecond line', {
    pets: ['CATS'],
    requestedArrivalDate: '2026-09-10',
    selfcare: 'No',
    consent: true,
    substances: 'Sensitive answer',
  }),
};
const source = {
  referral,
  clientName: 'Ana Muñoz',
  generatedAt: '2026-09-08T12:30:00Z',
};

const profile: ProfileCardData = {
  firstName: 'Ana',
  lastName: 'Muñoz',
  nickname: 'Anita',
  displayGender: 'Woman',
  age: 35,
  adaAccommodation: [AdaAccommodationEnum.Mobility, null],
  householdMembers: [{}, {}],
  veteranStatus: VeteranStatusEnum.Yes,
};

it('includes the same profile facts as the form and protects accommodations with the sensitive toggle', () => {
  const input = { ...source, profile };
  const original = JSON.stringify(input);
  const standard = buildReferralTextCopy(input).text;
  expect(standard).toContain('Name: Ana Muñoz (Anita)');
  expect(standard).toContain('Gender: Woman');
  expect(standard).toContain('Age: 35');
  expect(standard).toContain('Partners / household: 2 on file');
  expect(standard).toContain('Veteran: Yes');
  expect(standard).toContain(
    'Accommodations [Sensitive]: Excluded (sensitive)',
  );
  expect(standard).not.toContain('Accommodations [Sensitive]: Mobility');
  expect(
    buildReferralTextCopy({ ...input, includePrivate: true }).text,
  ).toContain('Accommodations [Sensitive]: Mobility');
  expect(standard).toContain('current profile values, not a snapshot');
  expect(JSON.stringify(input)).toBe(original);
});

it('lists every collected form field even when the sparse saved record has no answer', () => {
  const { text } = buildReferralTextCopy({
    ...source,
    referral: { ...referral, notes: null },
    includePrivate: true,
  });
  for (const field of INTAKE_FIELDS) {
    const label =
      field.label +
      (field.sensitive || field.backend.mode === 'direct'
        ? ' [Sensitive]'
        : '');
    expect(text).toContain(`${label}: Not recorded`);
  }
  expect(text).toContain('Gender: Not recorded');
  expect(text).toContain('Age: Not recorded');
  expect(text).toContain('Not recorded means unknown, not No');
  expect(text).toContain('Reference-only Smartsheet fields are not collected');
});

it('does not invent a negative consent answer when the legacy format stored no answer', () => {
  const { text } = buildReferralTextCopy({
    ...source,
    referral: { ...referral, notes: null },
  });
  expect(text).toContain('DHS data-sharing consent: Not recorded');
  expect(text).not.toMatch(/^DHS data-sharing consent: No$/m);
});

it('includes every collected answer for a fully populated fictional form', () => {
  const answers: Record<string, unknown> = {};
  for (const field of INTAKE_FIELDS) {
    switch (field.control) {
      case 'multiselect':
        answers[field.key] = [field.options[0].value];
        break;
      case 'date':
        answers[field.key] = '2026-10-20';
        break;
      case 'yesno':
        answers[field.key] = 'No';
        break;
      case 'checkbox':
        answers[field.key] = true;
        break;
      default:
        answers[field.key] = 'Fictional saved answer';
    }
  }
  const { text } = buildReferralTextCopy({
    ...source,
    profile,
    referral: { ...referral, notes: encodeReferralNotes('', answers) },
    includePrivate: true,
  });
  for (const field of INTAKE_FIELDS) {
    const label =
      field.label +
      (field.sensitive || field.backend.mode === 'direct'
        ? ' [Sensitive]'
        : '');
    expect(text).toContain(`${label}: `);
    expect(text).not.toContain(`${label}: Not recorded`);
    expect(text).not.toContain(`${label}: Excluded`);
    if (field.control === 'multiselect') {
      expect(text).toContain(`${label}: ${field.options[0].label}`);
    }
  }
  expect(text).toContain('DHS data-sharing consent: Yes');
  expect(text).toContain('Able to practice self-care: No');
  expect(text).toContain('Requested arrival date: 2026-10-20');
  expect(text).toContain(
    'Staff Observations / Notes [Sensitive]: Fictional saved answer',
  );
  expect(text).not.toContain('not a complete archival copy');
});

it('exports only profile fields shown on the form, not every property fetched by the client query', () => {
  const extraProfile = {
    ...profile,
    email: 'not-part-of-this-form@example.com',
    californiaId: 'DO-NOT-EXPORT',
  };
  const { text } = buildReferralTextCopy({
    ...source,
    profile: extraProfile,
    includePrivate: true,
  });
  expect(text).not.toContain('not-part-of-this-form@example.com');
  expect(text).not.toContain('DO-NOT-EXPORT');
});

it.each([false, true])(
  'uses consistent privacy labels without implying eligibility when sensitive inclusion is %s',
  (includePrivate) => {
    const { text } = buildReferralTextCopy({
      ...source,
      profile,
      includePrivate,
    });
    expect(text).toContain(
      '[Sensitive] identifies fields controlled by the sharing privacy option. It does not assess the client or shelter eligibility.',
    );
    expect(text).toContain('Accommodations [Sensitive]: ');
    for (const field of INTAKE_FIELDS) {
      const sensitive = field.sensitive || field.backend.mode === 'direct';
      expect(text.includes(`${field.label} [Sensitive]: `)).toBe(sensitive);
    }
    expect(text).toContain('Age: 35');
    expect(text).not.toContain('Age [Sensitive]:');
    if (!includePrivate) {
      expect(text).not.toContain('Sensitive answer');
      expect(text).not.toContain('Private observation');
    }
  },
);

it('builds a readable Unicode copy from saved answers with separate creation, arrival and export dates', () => {
  const { text } = buildReferralTextCopy(source);
  expect(text).toContain('Ana Muñoz');
  expect(text).toContain('Fictional Shelter');
  expect(text).toContain('123 Test St');
  expect(text).toContain('Referrer: A Volunteer');
  expect(text).toMatch(/Created: Sep 1, 2026, 12:00 PM UTC/);
  expect(text).toContain('Requested arrival date: 2026-09-10');
  expect(text).toMatch(/Copy generated: Sep 8, 2026, 12:30 PM UTC/);
  expect(text).toContain('Animals with the client: Cats');
  expect(text).toContain('Able to practice self-care: No');
  expect(text).toContain('DHS data-sharing consent: Yes');
  expect(text).not.toContain('referral-intake');
  expect(text).not.toContain('selfcare:');
});

it('excludes private values by default and includes them only when requested, preserving saved data', () => {
  const original = JSON.stringify(referral);
  const standard = buildReferralTextCopy(source).text;
  expect(standard).not.toContain('Sensitive answer');
  expect(standard).not.toContain('Private observation');
  const full = buildReferralTextCopy({ ...source, includePrivate: true }).text;
  expect(full).toContain('Sensitive answer');
  expect(full).toContain('Private observation\nSecond line');
  expect(JSON.stringify(referral)).toBe(original);
});

it.each([
  ReferralStatusEnum.Pending,
  ReferralStatusEnum.Accepted,
  ReferralStatusEnum.Declined,
])(
  'preserves the recorded %s outcome and makes no delivery claim',
  (status) => {
    const { text } = buildReferralTextCopy({
      ...source,
      referral: { ...referral, status },
    });
    expect(text).toContain('This copy does not confirm shelter receipt');
    expect(text).toContain(
      `Recorded outcome: ${status[0]}${status.slice(1).toLowerCase()}`,
    );
  },
);

it('handles missing profile/shelter/referrer values without invented information', () => {
  const { text } = buildReferralTextCopy({
    ...source,
    clientName: '',
    referral: {
      __typename: 'ReferralType',
      createdAt: '2026-09-08T12:00:00Z',
      id: 'r2',
      status: null,
      notes: null,
      shelter: null,
      createdBy: null,
    },
  });
  expect(text).toContain('Shelter: Not recorded');
  expect(text).toContain('Referrer: Not recorded');
  expect(text).not.toMatch(/undefined|null/);
});

it.each([
  '\n\n<<<referral-intake:v2>>>\n{}',
  '\n\n<<<referral-intake:v1>>>\n{broken\n<<<end-referral-intake>>>',
])(
  'refuses an unreliable copy of malformed or newer stored intake',
  (notes) => {
    expect(() =>
      buildReferralTextCopy({ ...source, referral: { ...referral, notes } }),
    ).toThrow(/reliable summary/);
  },
);

it('identifies unrecognized or invalid saved answers instead of presenting a complete archive', () => {
  const notes = encodeReferralNotes('', {
    pets: ['OLD_PET'],
    futureSensitive: 'DO NOT LEAK',
    selfcare: 'No',
  });
  const { text } = buildReferralTextCopy({
    ...source,
    referral: { ...referral, notes },
    includePrivate: true,
  });
  expect(text).toContain('not a complete archival copy');
  expect(text).not.toContain('DO NOT LEAK');
  expect(text).not.toContain('OLD_PET');
  expect(text).toContain('Able to practice self-care: No');
});
