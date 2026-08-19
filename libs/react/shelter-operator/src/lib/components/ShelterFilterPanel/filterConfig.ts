import {
  AccessibilityChoices,
  DemographicChoices,
  EntryRequirementChoices,
  enumDisplayAccessibilityChoices,
  enumDisplayDemographics,
  enumDisplayEntryRequirementChoices,
  enumDisplayParkingChoices,
  enumDisplayPetChoices,
  enumDisplayReferralRequirementChoices,
  enumDisplayRoomStyles,
  enumDisplayShelterChoices,
  enumDisplaySpecialSituationRestrictionChoices,
  ParkingChoices,
  PetChoices,
  ReferralRequirementChoices,
  RoomStyleChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
} from '@monorepo/react/shelter';

export type TFilterOption = {
  label: string;
  value: string;
};

export type TFilterGroupConfig = {
  name: string;
  header: string;
  options: TFilterOption[];
  activeClassName: string;
};

const demographicOptions: TFilterOption[] = [
  DemographicChoices.SingleMen,
  DemographicChoices.SingleWomen,
  DemographicChoices.TayTeen,
  DemographicChoices.Seniors,
  DemographicChoices.Families,
  DemographicChoices.Couples,
  DemographicChoices.SingleMoms,
  DemographicChoices.SingleDads,
  DemographicChoices.LgbtqPlus,
  DemographicChoices.Other,
  DemographicChoices.All,
].map((v) => ({ label: enumDisplayDemographics[v], value: v }));

const ssrOptions: TFilterOption[] = [
  SpecialSituationRestrictionChoices.DomesticViolence,
  SpecialSituationRestrictionChoices.HarmReduction,
  SpecialSituationRestrictionChoices.HivAids,
  SpecialSituationRestrictionChoices.HumanTrafficking,
  SpecialSituationRestrictionChoices.JusticeSystems,
  SpecialSituationRestrictionChoices.Veterans,
  SpecialSituationRestrictionChoices.None,
].map((v) => ({
  label: enumDisplaySpecialSituationRestrictionChoices[v],
  value: v,
}));

const shelterTypeOptions: TFilterOption[] = [
  ShelterChoices.AccessCenter,
  ShelterChoices.Building,
  ShelterChoices.Church,
  ShelterChoices.HotelMotel,
  ShelterChoices.SafeParking,
  ShelterChoices.SingleFamilyHouse,
  ShelterChoices.TinyHomes,
  ShelterChoices.Other,
].map((v) => ({ label: enumDisplayShelterChoices[v], value: v }));

const petOptions: TFilterOption[] = [
  PetChoices.Cats,
  PetChoices.DogsUnder_25Lbs,
  PetChoices.DogsOver_25Lbs,
  PetChoices.ServiceAnimals,
  PetChoices.Exotics,
  PetChoices.PetArea,
  PetChoices.NoPetsAllowed,
].map((v) => ({ label: enumDisplayPetChoices[v], value: v }));

const entryRequirementOptions: TFilterOption[] = [
  EntryRequirementChoices.WalkUps,
  EntryRequirementChoices.PhotoId,
  EntryRequirementChoices.Referral,
  EntryRequirementChoices.Reservation,
  EntryRequirementChoices.Background,
  EntryRequirementChoices.HomelessVerification,
  EntryRequirementChoices.InSpaOnly,
  EntryRequirementChoices.MedicaidOrMedicare,
  EntryRequirementChoices.VehicleRegistration,
].map((v) => ({ label: enumDisplayEntryRequirementChoices[v], value: v }));

const referralRequirementOptions: TFilterOption[] = [
  ReferralRequirementChoices.SelfReferral,
  ReferralRequirementChoices.SameDayIntake,
  ReferralRequirementChoices.ReferralMatched,
  ReferralRequirementChoices.ReferralNonmatched,
  ReferralRequirementChoices.ServiceProviderSubmission,
].map((v) => ({ label: enumDisplayReferralRequirementChoices[v], value: v }));

const roomStyleOptions: TFilterOption[] = [
  RoomStyleChoices.Congregate,
  RoomStyleChoices.CubicleLowWalls,
  RoomStyleChoices.CubicleHighWalls,
  RoomStyleChoices.LowBunk,
  RoomStyleChoices.HighBunk,
  RoomStyleChoices.SharedRooms,
  RoomStyleChoices.SingleRoom,
  RoomStyleChoices.MotelRoom,
  RoomStyleChoices.Other,
].map((v) => ({ label: enumDisplayRoomStyles[v], value: v }));

const parkingOptions: TFilterOption[] = [
  ParkingChoices.Automobile,
  ParkingChoices.Motorcycle,
  ParkingChoices.Bicycle,
  ParkingChoices.Rv,
  ParkingChoices.Street,
  ParkingChoices.NoParking,
].map((v) => ({ label: enumDisplayParkingChoices[v], value: v }));

const accessibilityOptions: TFilterOption[] = [
  AccessibilityChoices.AdaRooms,
  AccessibilityChoices.MedicalEquipmentPermitted,
  AccessibilityChoices.WheelchairAccessible,
].map((v) => ({ label: enumDisplayAccessibilityChoices[v], value: v }));

export const filterGroups: TFilterGroupConfig[] = [
  {
    name: 'demographics',
    header: 'Demographic',
    options: demographicOptions,
    activeClassName: 'bg-tags-main text-black',
  },
  {
    name: 'accessibility',
    header: 'Accessibility',
    options: accessibilityOptions,
    activeClassName: 'bg-tags-main text-black',
  },
  {
    name: 'specialSituationRestrictions',
    header: 'Special Situation Restriction',
    options: ssrOptions,
    activeClassName: 'bg-tags-yellow text-black',
  },
  {
    name: 'shelterTypes',
    header: 'Shelter Type',
    options: shelterTypeOptions,
    activeClassName: 'bg-tags-purple text-black',
  },
  {
    name: 'pets',
    header: 'Pets',
    options: petOptions,
    activeClassName: 'bg-tags-pink text-black',
  },
  {
    name: 'entryRequirements',
    header: 'Entry Requirements',
    options: entryRequirementOptions,
    activeClassName: 'bg-tags-blue text-black',
  },
  {
    name: 'referralRequirement',
    header: 'Referral Requirement',
    options: referralRequirementOptions,
    activeClassName: 'bg-tags-main text-black',
  },
  {
    name: 'roomStyles',
    header: 'Room Style',
    options: roomStyleOptions,
    activeClassName: 'bg-tags-yellow text-black',
  },
  {
    name: 'parking',
    header: 'Parking',
    options: parkingOptions,
    activeClassName: 'bg-tags-purple text-black',
  },
];
