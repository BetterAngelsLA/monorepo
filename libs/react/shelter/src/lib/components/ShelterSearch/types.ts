import {
  DemographicChoices,
  EntryRequirementChoices,
  ParkingChoices,
  PetChoices,
  ReferralRequirementChoices,
  RoomStyleChoices,
  ScheduleTypeChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
} from '../../apollo';

export type TShelterPropertyFilters = {
  openNowScheduleTypes?: ScheduleTypeChoices[] | null;
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
