/**
 * ffReferrals gate at the tab strip.
 *
 * Production default: the flag is absent or off (waffle flags resolve to false
 * when unknown), so the tab must not exist at all. The Referrals screen tests
 * cover the feature itself; this covers that it cannot be reached without the
 * flag.
 */
import { render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import ClientTabs, { ClientViewTabEnum } from './ClientTabs';

const flags = vi.hoisted(() => ({ referrals: false, canView: true }));

// Partial mock: the real module stays in place, so an import the component
// grows later fails loudly instead of resolving to `undefined` from an empty
// mock.
vi.mock('@monorepo/ba-platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@monorepo/ba-platform')>()),
  useActiveOrg: () => ({
    hasPermission: () => flags.canView,
  }),
}));

vi.mock('@monorepo/react/shared', () => ({
  useFeatureFlagActive: (name: string) =>
    name === 'ffReferrals' ? flags.referrals : false,
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  TextButton: ({ title, testId }: { title?: string; testId?: string }) => (
    <Pressable accessibilityRole="button" testID={testId}>
      <Text>{title}</Text>
    </Pressable>
  ),
}));

const noop = () => undefined;

it('hides the Referrals tab while ffReferrals is off', async () => {
  flags.referrals = false;
  await render(
    <ClientTabs selectedTab={ClientViewTabEnum.Profile} setTab={noop} />,
  );

  expect(screen.queryByTestId('client-tab-referrals')).toBeNull();
  expect(screen.getByTestId('client-tab-profile')).toBeOnTheScreen();
});

it('shows the Referrals tab when ffReferrals is on and referrals.view_referral is granted', async () => {
  flags.referrals = true;
  flags.canView = true;
  await render(
    <ClientTabs selectedTab={ClientViewTabEnum.Profile} setTab={noop} />,
  );

  expect(screen.getByTestId('client-tab-referrals')).toBeOnTheScreen();
});

it('hides the Referrals tab without referrals.view_referral, even when the flag is on', async () => {
  flags.referrals = true;
  flags.canView = false;
  await render(
    <ClientTabs selectedTab={ClientViewTabEnum.Profile} setTab={noop} />,
  );

  expect(screen.queryByTestId('client-tab-referrals')).toBeNull();
  expect(screen.getByTestId('client-tab-profile')).toBeOnTheScreen();
});
