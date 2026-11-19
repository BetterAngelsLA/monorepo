import { ClientViewTabEnum } from './clientViewTab';
import { shouldShowShelterAction } from './shouldShowShelterAction';

/**
 * The header is shared: with the referrals flag on it renders on every tab but
 * Locations, so this rule is the only thing keeping the shelter action off the
 * screens where it does not belong.
 */
it.each([
  [ClientViewTabEnum.Profile, true],
  [ClientViewTabEnum.Interactions, false],
  [ClientViewTabEnum.Tasks, false],
  [ClientViewTabEnum.Docs, false],
  [ClientViewTabEnum.Locations, false],
])('shows on %s: %s', (tab, expected) => {
  expect(shouldShowShelterAction(tab)).toBe(expected);
});
