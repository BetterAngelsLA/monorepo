import { render, screen } from '@testing-library/react-native';
import { Component, type ReactNode } from 'react';
import { Text } from 'react-native';
import {
  ReferralPermissionsProvider,
  useReferralPermissions,
} from './ReferralPermissions';

const gates = vi.hoisted(() => ({
  canView: true,
  canCreate: true,
  canChange: false,
}));

vi.mock('../../../hooks/referral/useReferralGates', () => ({
  useActiveReferralGates: () => gates,
}));

function Probe() {
  const { canView, canCreate, canChange } = useReferralPermissions();
  return <Text testID="gates">{`${canView}/${canCreate}/${canChange}`}</Text>;
}

it('exposes the active gates through the provider', async () => {
  await render(
    <ReferralPermissionsProvider>
      <Probe />
    </ReferralPermissionsProvider>,
  );
  expect(screen.getByTestId('gates')).toHaveTextContent('true/true/false');
});

class ErrorBoundary extends Component<
  { children: ReactNode },
  { message: string | null }
> {
  state: { message: string | null } = { message: null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  render() {
    return this.state.message ? (
      <Text testID="gate-error">{this.state.message}</Text>
    ) : (
      this.props.children
    );
  }
}

it('fails closed without the provider instead of allowing every action', async () => {
  // The old permissive default made a missing provider look like full access.
  await render(
    <ErrorBoundary>
      <Probe />
    </ErrorBoundary>,
  );
  expect(screen.getByTestId('gate-error')).toHaveTextContent(
    /ReferralPermissionsProvider/,
  );
});
