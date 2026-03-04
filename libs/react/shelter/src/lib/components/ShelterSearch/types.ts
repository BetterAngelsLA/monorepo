import {
  DemographicChoices,
  ParkingChoices,
  PetChoices,
  RoomStyleChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
} from '../../apollo';

export type TShelterPropertyFilters = {
  demographics?: DemographicChoices[] | null;
  parking?: ParkingChoices[] | null;
  pets?: PetChoices[] | null;
  roomStyles?: RoomStyleChoices[] | null;
  shelterTypes?: ShelterChoices[] | null;
  specialSituationRestrictions?: SpecialSituationRestrictionChoices[] | null;
};
