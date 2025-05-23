import { ClientProfileQuery } from '../../screens/Client/__generated__/Client.generated';

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
