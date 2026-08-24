import {
  AccessibilityChoices,
  CITY_COUNCIL_DISTRICT_UNINCORPORATED,
  DemographicChoices,
  EntryRequirementChoices,
  enumDisplayAccessibilityChoices,
  enumDisplayDemographics,
  enumDisplayEntryRequirementChoices,
  enumDisplayFunderChoices,
  enumDisplayParkingChoices,
  enumDisplayPetChoices,
  enumDisplayReferralRequirementChoices,
  enumDisplayRoomStyles,
  enumDisplayShelterChoices,
  enumDisplayShelterProgramChoices,
  enumDisplaySpecialSituationRestrictionChoices,
  enumDisplayStorageChoices,
  enumStatusChoices,
  FunderChoices,
  ParkingChoices,
  PetChoices,
  ReferralRequirementChoices,
  RoomStyleChoices,
  ShelterChoices,
  ShelterProgramChoices,
  SpecialSituationRestrictionChoices,
  StatusChoices,
  StorageChoices,
} from '@monorepo/react/shelter';
import type { TOperatorShelterFilters } from '../../atoms/shelterFiltersAtom';

export type TFilterOption = {
  label: string;
  value: string;
};

/** Static chip groups map onto string[] keys on the filters atom. */
export type TFilterGroupName = Exclude<
  {
    [K in keyof TOperatorShelterFilters]: TOperatorShelterFilters[K] extends string[]
      ? K
      : never;
  }[keyof TOperatorShelterFilters],
  never
>;

export type TFilterGroupConfig = {
  name: TFilterGroupName;
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

const storageOptions: TFilterOption[] = [
  StorageChoices.AmnestyLockers,
  StorageChoices.StandardLockers,
  StorageChoices.SharedStorage,
  StorageChoices.UnitStorage,
  StorageChoices.PersonalBin,
  StorageChoices.NoStorage,
].map((v) => ({ label: enumDisplayStorageChoices[v], value: v }));

const shelterProgramOptions: TFilterOption[] = [
  ShelterProgramChoices.EmergencyShelter,
  ShelterProgramChoices.InterimHousing,
  ShelterProgramChoices.TransitionalHousing,
  ShelterProgramChoices.PermanentHousing,
  ShelterProgramChoices.RapidRehousing,
  ShelterProgramChoices.BridgeHome,
  ShelterProgramChoices.CrisisHousing,
  ShelterProgramChoices.FaithBased,
  ShelterProgramChoices.ProjectHomeKey,
  ShelterProgramChoices.RecuperativeCare,
  ShelterProgramChoices.RoadmapHome,
  ShelterProgramChoices.SafeParkLa,
  ShelterProgramChoices.SoberLiving,
  ShelterProgramChoices.TinyHomeVillage,
  ShelterProgramChoices.WinterShelter,
  ShelterProgramChoices.Other,
].map((v) => ({ label: enumDisplayShelterProgramChoices[v], value: v }));

const funderOptions: TFilterOption[] = [
  FunderChoices.Lahsa,
  FunderChoices.CityOfLosAngeles,
  FunderChoices.Dhs,
  FunderChoices.Dmh,
  FunderChoices.FederalFunding,
  FunderChoices.Hopwa,
  FunderChoices.Private,
  FunderChoices.Other,
].map((v) => ({ label: enumDisplayFunderChoices[v], value: v }));

const statusOptions: TFilterOption[] = [
  StatusChoices.Approved,
  StatusChoices.Pending,
  StatusChoices.Draft,
  StatusChoices.Inactive,
].map((v) => ({ label: enumStatusChoices[v], value: v }));

const overallRatingOptions: TFilterOption[] = [1, 2, 3, 4, 5].map((n) => ({
  label: String(n),
  value: String(n),
}));

// 0 = Unincorporated, 1–15 = districts (matches CITY_COUNCIL_DISTRICT_CHOICES on backend)
const cityCouncilDistrictOptions: TFilterOption[] = [
  { label: 'Unincorporated', value: String(CITY_COUNCIL_DISTRICT_UNINCORPORATED) },
  ...Array.from({ length: 15 }, (_, i) => ({
    label: String(i + 1),
    value: String(i + 1),
  })),
];

// 1–5 (matches SUPERVISORIAL_DISTRICT_CHOICES on backend)
const supervisorialDistrictOptions: TFilterOption[] = Array.from(
  { length: 5 },
  (_, i) => ({ label: String(i + 1), value: String(i + 1) }),
);

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
  {
    name: 'storage',
    header: 'Storage',
    options: storageOptions,
    activeClassName: 'bg-tags-blue text-black',
  },
  {
    name: 'shelterPrograms',
    header: 'Shelter Program',
    options: shelterProgramOptions,
    activeClassName: 'bg-tags-pink text-black',
  },
  {
    name: 'funders',
    header: 'Funder',
    options: funderOptions,
    activeClassName: 'bg-tags-main text-black',
  },
  {
    name: 'status',
    header: 'Status',
    options: statusOptions,
    activeClassName: 'bg-tags-yellow text-black',
  },
  {
    name: 'overallRating',
    header: 'Overall Rating',
    options: overallRatingOptions,
    activeClassName: 'bg-tags-purple text-black',
  },
  {
    name: 'cityCouncilDistrict',
    header: 'LA City Council District',
    options: cityCouncilDistrictOptions,
    activeClassName: 'bg-tags-blue text-black',
  },
  {
    name: 'supervisorialDistrict',
    header: 'Supervisorial District',
    options: supervisorialDistrictOptions,
    activeClassName: 'bg-tags-pink text-black',
  },
];
