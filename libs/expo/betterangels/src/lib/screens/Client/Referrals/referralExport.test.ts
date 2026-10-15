import { ReferralStatusEnum } from '../../../apollo';
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
