import { UseShelterOperatorProfileResultType } from '../../hooks/useShelterOperatorProfile';

export type ShelterProfileType = UseShelterOperatorProfileResultType;

export type ShelterProfilePhotoType = NonNullable<
  UseShelterOperatorProfileResultType
>['photos'][number];
