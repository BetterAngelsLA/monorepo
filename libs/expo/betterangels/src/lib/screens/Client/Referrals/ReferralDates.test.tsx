import { render, screen, within } from '@testing-library/react-native';
import { Colors } from '@monorepo/expo/shared/static';
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import { DraftCard } from './DraftCard';
import { ReferralCard } from './ReferralCard';
import { ReferralPermissionsProvider } from './ReferralPermissions';
import { RequestedArrivalDate } from './RequestedArrivalDate';
import { encodeReferralNotes } from './referralIntakeSidecar';

vi.mock('../../../hooks/referral/useReferralGates', () => ({
  useActiveReferralGates: () => ({
    canView: true,
    canCreate: true,
    canChange: true,
  }),
}));

vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());
vi.mock('./ReferralShare', () => ({ ReferralShare: () => null }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 19, 12));
});
afterEach(() => vi.useRealTimers());

it.each([
  ['2026-10-18', '10/18/2026 (Past)', Colors.ERROR],
  ['2026-10-19', '10/19/2026', Colors.PRIMARY_EXTRA_DARK],
  ['2026-10-20', '10/20/2026', Colors.PRIMARY_EXTRA_DARK],
])(
  'labels and colors arrival %s without relying on color alone',
  async (value, label, color) => {
    await render(<RequestedArrivalDate value={value} />);
    expect(screen.getByTestId('referral-arrival-date')).toHaveTextContent(
      `Requested arrival: ${label}`,
    );
    expect(screen.getByTestId('referral-arrival-date').props.color).toBe(color);
    expect(screen.getByTestId('referral-arrival-date').props.size).toBe('ms');
  },
);

it.each([
  [undefined, 'Not recorded'],
  ['2026-02-30', 'Unrecognized saved date'],
  [0, 'Unrecognized saved date'],
])('keeps missing/invalid arrival %j explicit', async (value, label) => {
  await render(<RequestedArrivalDate value={value} />);
  expect(screen.getByTestId('referral-arrival-date')).toHaveTextContent(
    `Requested arrival: ${label}`,
  );
  expect(screen.queryByText(/\(Past\)/)).toBeNull();
});

it('separates a draft arrival date from Last edited and retains the pending-save warning', async () => {
  await render(
    <DraftCard
      updatedAt={new Date(2026, 9, 19, 9, 5).getTime()}
      requestedArrivalDate="2026-10-18"
      status="uncertain"
      onResume={vi.fn()}
      onDiscard={vi.fn()}
    />,
  );
  expect(screen.getByTestId('referral-arrival-date')).toHaveTextContent(
    'Requested arrival: 10/18/2026 (Past)',
  );
  expect(screen.getByText(/Last edited: 9:05 AM/)).toHaveTextContent(
    /Save outcome unknown\. Check the referral list\./,
  );
  expect(screen.queryByText(/Referred:/)).toBeNull();
});

it('keeps original Referred metadata separate from the prominent saved arrival', async () => {
  const referral = {
    __typename: 'ReferralType' as const,
    id: 'saved',
    createdAt: new Date(2026, 9, 10, 12).toISOString(),
    shelter: null,
    createdBy: null,
    status: null,
    notes: encodeReferralNotes('Do not change', {
      requestedArrivalDate: '2026-10-18',
    }),
  };
  const before = JSON.stringify(referral);
  await render(
    <ReferralPermissionsProvider>
      <ReferralCard
        referral={referral}
        clientName="Fictional client"
        onEdit={vi.fn()}
        onReferAgain={vi.fn()}
      />
    </ReferralPermissionsProvider>,
  );
  const card = within(screen.getByTestId('referral-card-saved'));
  expect(card.getByText('Referred: 10/10/2026')).toBeOnTheScreen();
  expect(card.getByTestId('referral-arrival-date')).toHaveTextContent(
    'Requested arrival: 10/18/2026 (Past)',
  );
  expect(card.getByTestId('edit-referral-saved')).toBeOnTheScreen();
  expect(
    card.queryByText(/Intake \(temporary\):.*Requested arrival/),
  ).toBeNull();
  expect(JSON.stringify(referral)).toBe(before);
});
