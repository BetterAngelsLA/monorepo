import { GetAdminShelterProfileQuery } from './__generated__/useAdminShelterProfile.generated';

export type UseAdminShelterProfileResultType =
  GetAdminShelterProfileQuery['operatorShelter'];

export type UseAdminShelterProfilePhotoType =
  GetAdminShelterProfileQuery['operatorShelter']['photos'][number];
