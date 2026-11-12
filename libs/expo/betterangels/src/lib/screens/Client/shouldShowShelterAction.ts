import { ClientViewTabEnum } from './clientViewTab';

/**
 * Whether the shelter action belongs on this tab.
 *
 * Profile only: with the referrals flag on, the client header also renders on
 * Interactions, Tasks and Docs, where a shelter action is noise rather than a
 * client-level fact. Pulled out of the screen so the rule can be asserted
 * without mounting it.
 */
export function shouldShowShelterAction(tab: ClientViewTabEnum): boolean {
  return tab === ClientViewTabEnum.Profile;
}
