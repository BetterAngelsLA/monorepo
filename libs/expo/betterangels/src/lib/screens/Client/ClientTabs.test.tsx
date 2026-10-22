/**
 * Referrals tab gates: `ffReferrals` AND the org's `referrals.view_referral`.
 *
 * The flag decides whether the pilot is on for this account; the capability
 * (grant-backed, surfaced in the per-org effective report) decides who may use
 * it. Neither alone is enough: flag-only shows the tab to users the API will
 * refuse, capability-only would expose an unfinished feature.
 */
import { ActiveOrgProvider, type Org } from '@monorepo/ba-platform';
import { render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import ClientTabs, {
  ClientViewTabEnum,
  resolveClientTab,
} from './ClientTabs';

const flags = vi.hoisted(() => ({ referrals: false }));

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

const withReferralCapability: Org[] = [
  { id: 'org-1', name: 'Org 1', permissions: ['referrals.view_referral'] },
];
const withoutReferralCapability: Org[] = [
  { id: 'org-1', name: 'Org 1', permissions: ['notes.add_note'] },
];

function renderTabs(organizations: Org[]) {
  return render(
    <ActiveOrgProvider organizations={organizations}>
      <ClientTabs selectedTab={ClientViewTabEnum.Profile} setTab={noop} />
    </ActiveOrgProvider>,
  );
}

it('hides the Referrals tab while ffReferrals is off', async () => {
  flags.referrals = false;
  await renderTabs(withReferralCapability);

  expect(screen.queryByTestId('client-tab-referrals')).toBeNull();
  expect(screen.getByTestId('client-tab-profile')).toBeOnTheScreen();
});

it('hides the Referrals tab when the org lacks view_referral', async () => {
  flags.referrals = true;
  await renderTabs(withoutReferralCapability);

  expect(screen.queryByTestId('client-tab-referrals')).toBeNull();
  expect(screen.getByTestId('client-tab-profile')).toBeOnTheScreen();
});

it('shows the Referrals tab when the flag is on and the org can view referrals', async () => {
  flags.referrals = true;
  await renderTabs(withReferralCapability);

  expect(screen.getByTestId('client-tab-referrals')).toBeOnTheScreen();
});

describe('resolveClientTab', () => {
  // The tab button gate is not enough: a deep link or a selected tab that
  // predates a capability/flag change must not keep rendering the screen.
  it('drops Referrals when the gate is closed', () => {
    expect(
      resolveClientTab(ClientViewTabEnum.Referrals, false),
    ).toBeUndefined();
  });

  it('keeps Referrals when the gate is open', () => {
    expect(resolveClientTab(ClientViewTabEnum.Referrals, true)).toBe(
      ClientViewTabEnum.Referrals,
    );
  });

  it('leaves other tabs alone', () => {
    expect(resolveClientTab(ClientViewTabEnum.Tasks, false)).toBe(
      ClientViewTabEnum.Tasks,
    );
    expect(resolveClientTab(undefined, false)).toBeUndefined();
  });
});
