import { ClientProfilesQuery } from './__generated__/ClientProfiles.generated';

export type TClientProfile =
  ClientProfilesQuery['clientProfiles']['results'][number];

export type ListHeaderProps = {
  totalClients: number;
  visibleClients: number;
};
