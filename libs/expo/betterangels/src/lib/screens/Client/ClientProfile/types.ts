import { ClientProfileQuery } from '../__generated__/Client.generated';
import { ClientProfileCardTitles } from './constants';

export type TClientProfileCardTitleKey = keyof typeof ClientProfileCardTitles;
export type TClientProfileCardTitle =
  (typeof ClientProfileCardTitles)[TClientProfileCardTitleKey];

export type TClientProfile = ClientProfileQuery['clientProfile'];

export type TClientProfileContact = NonNullable<
  NonNullable<ClientProfileQuery['clientProfile']>['contacts']
>[number];

export type TClientProfileHouseholdMemeber = NonNullable<
  NonNullable<ClientProfileQuery['clientProfile']>['householdMembers']
>[number];

export type TClientProfileHmisProfile = NonNullable<
  NonNullable<ClientProfileQuery['clientProfile']>['hmisProfiles']
>[number];
