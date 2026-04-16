import {
  DemographicChoices,
  ParkingChoices,
  PetChoices,
  RoomStyleChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
} from '../../apollo';

export type TShelterPropertyFilters = {
  openNow?: boolean | null;
  isAccessCenter?: boolean | null;
  maxStay?: { days: number; includeNull: boolean };
  demographics?: DemographicChoices[] | null;
  parking?: ParkingChoices[] | null;
  pets?: PetChoices[] | null;
  roomStyles?: RoomStyleChoices[] | null;
  shelterTypes?: ShelterChoices[] | null;
  specialSituationRestrictions?: SpecialSituationRestrictionChoices[] | null;
};
