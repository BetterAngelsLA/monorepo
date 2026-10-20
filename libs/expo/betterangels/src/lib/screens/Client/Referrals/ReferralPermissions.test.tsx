import { ReferralPermissions } from '@monorepo/ba-platform/permissions';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import {
  ReferralPermissionsProvider,
  useReferralPermissions,
} from './ReferralPermissions';

const granted = vi.hoisted(() => new Set<string>());

vi.mock('@monorepo/ba-platform', () => ({
  useActiveOrg: () => ({
    hasPermission: (permission: string) => granted.has(permission),
  }),
}));

function Probe() {
  const { canView, canCreate, canChange } = useReferralPermissions();
  return (
    <Text testID="gates">{`${canView}/${canCreate}/${canChange}`}</Text>
  );
}

beforeEach(() => granted.clear());

it('maps the active org permissions to the referral gates', async () => {
  granted.add(ReferralPermissions.View);
  granted.add(ReferralPermissions.Add);
  await render(
    <ReferralPermissionsProvider>
      <Probe />
    </ReferralPermissionsProvider>,
  );
  expect(screen.getByTestId('gates')).toHaveTextContent('true/true/false');
});

it('denies every gate when the active org grants nothing', async () => {
  await render(
    <ReferralPermissionsProvider>
      <Probe />
    </ReferralPermissionsProvider>,
  );
  expect(screen.getByTestId('gates')).toHaveTextContent('false/false/false');
});

it('falls back to the permissive default outside the provider', async () => {
  await render(<Probe />);
  expect(screen.getByTestId('gates')).toHaveTextContent('true/true/true');
});
