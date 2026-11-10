/**
 * The client screen's tabs.
 *
 * A leaf module on purpose: helpers and tests need the names without pulling in
 * `ClientTabs.tsx`, whose tab bar drags expo-router and the referral gates into
 * anything that only wanted the enum.
 */
export enum ClientViewTabEnum {
  Profile = 'Profile',
  Docs = 'Docs',
  Interactions = 'Interactions',
  Locations = 'Locations',
  Tasks = 'Tasks',
  Referrals = 'Referrals',
}
