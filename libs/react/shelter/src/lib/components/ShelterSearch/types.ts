import {
  DemographicChoices,
  EntryRequirementChoices,
  ParkingChoices,
  PetChoices,
  ReferralRequirementChoices,
  RoomStyleChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
} from '../../apollo';

export type TShelterPropertyFilters = {
  openNow?: boolean | null;
  isAccessCenter?: boolean | null;
  maxStay?: { days: number; includeNull: boolean };
  demographics?: DemographicChoices[] | null;
  entryRequirements?: EntryRequirementChoices[] | null;
  parking?: ParkingChoices[] | null;
  pets?: PetChoices[] | null;
  referralRequirement?: ReferralRequirementChoices[] | null;
  roomStyles?: RoomStyleChoices[] | null;
  shelterTypes?: ShelterChoices[] | null;
  specialSituationRestrictions?: SpecialSituationRestrictionChoices[] | null;
};
