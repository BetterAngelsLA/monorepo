import { render, screen } from '@testing-library/react-native';
import { icons, svg, uiComponents } from '../../../../../__mocks__/sharedBarrels';
import { ReferralPermissionsProvider } from '../ReferralPermissions';
import { ReferralCard } from './ReferralCard';

const gates = vi.hoisted(() => ({
  canView: true,
  canCreate: true,
  canChange: true,
}));

vi.mock('../../../../hooks/referral/useReferralGates', () => ({
  useActiveReferralGates: () => gates,
}));
vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());
vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));
vi.mock('@monorepo/ba-platform', () => ({
  useApiConfig: () => ({ apiUrl: 'https://api.test/graphql' }),
}));
vi.mock('../share/ReferralShare', () => ({ ReferralShare: () => null }));

const referral = {
  __typename: 'ReferralType' as const,
  id: 'r1',
  status: 'PENDING',
  notes: null,
  createdAt: '2026-09-01T12:00:00Z',
  createdBy: {
    __typename: 'UserType' as const,
    id: 'u1',
    firstName: 'A',
    lastName: 'V',
  },
  shelter: {
    __typename: 'ShelterType' as const,
    id: 's1',
    name: 'Shelter',
    location: null,
    pets: [],
    demographics: [],
    accessibility: [],
  },
};

const renderCard = () =>
  render(
    <ReferralPermissionsProvider>
      <ReferralCard
        referral={referral as never}
        clientName="Client"
        onEdit={vi.fn()}
        onReferAgain={vi.fn()}
      />
    </ReferralPermissionsProvider>,
  );

beforeEach(() => {
  Object.assign(gates, { canView: true, canCreate: true, canChange: true });
});

it('shows both actions when the org grants view, add and change', async () => {
  await renderCard();
  expect(screen.getByTestId('edit-referral-r1')).toBeOnTheScreen();
  expect(screen.getByTestId('reuse-referral-r1')).toBeOnTheScreen();
});

it('hides edit without referrals.change_referral', async () => {
  gates.canChange = false;
  await renderCard();
  expect(screen.queryByTestId('edit-referral-r1')).toBeNull();
  expect(screen.getByTestId('reuse-referral-r1')).toBeOnTheScreen();
});

it('hides refer-again without referrals.add_referral', async () => {
  gates.canCreate = false;
  await renderCard();
  expect(screen.queryByTestId('reuse-referral-r1')).toBeNull();
  expect(screen.getByTestId('edit-referral-r1')).toBeOnTheScreen();
});

it('renders neither action when the org grants neither', async () => {
  gates.canChange = false;
  gates.canCreate = false;
  await renderCard();
  expect(screen.queryByTestId('edit-referral-r1')).toBeNull();
  expect(screen.queryByTestId('reuse-referral-r1')).toBeNull();
});
