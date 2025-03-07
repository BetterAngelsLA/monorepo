import { ClientProfileQuery } from '../__generated__/Client.generated';
import { ClientSectionTitles } from './constants';

export type TClientSectionTitleKey = keyof typeof ClientSectionTitles;
export type TClientSectionTitle =
  (typeof ClientSectionTitles)[TClientSectionTitleKey];

/**
 * TODO:
 * 1. convert query to use fragments
 * -- libs/expo/betterangels/src/lib/apollo/graphql/fragments/clientProfile.ts
 * 2. define fragment types
 * -- libs/expo/betterangels/src/lib/apollo/graphql/types/clientProfile.ts
 */

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
