import {
  AccessibilityChoices,
  DemographicChoices,
  EntryRequirementChoices,
  ExitPolicyChoices,
  FunderChoices,
  ParkingChoices,
  PetChoices,
  ReferralRequirementChoices,
  RoomStyleChoices,
  ShelterChoices,
  ShelterProgramChoices,
  SpaChoices,
  SpecialSituationRestrictionChoices,
  StorageChoices,
  VaccinationRequirementChoices,
} from '../apollo';

export const enumDisplayAccessibilityChoices: {
  [key in AccessibilityChoices]: string;
} = {
  [AccessibilityChoices.AdaRooms]: 'ADA Rooms Available',
  [AccessibilityChoices.MedicalEquipmentPermitted]:
    'Medical Equipment Permitted',
  [AccessibilityChoices.WheelchairAccessible]: 'Wheelchair Accessible',
};

export const enumDisplayDemographics: { [key in DemographicChoices]: string } =
  {
    [DemographicChoices.All]: 'All',
    [DemographicChoices.Families]: 'Families',
    [DemographicChoices.Couples]: 'Couples',
    [DemographicChoices.LgbtqPlus]: 'LGBTQ+',
    [DemographicChoices.Other]: 'Others',
    [DemographicChoices.Seniors]: 'Seniors',
    [DemographicChoices.SingleDads]: 'Single Dads',
    [DemographicChoices.SingleMen]: 'Single Men',
    [DemographicChoices.SingleMoms]: 'Single Moms',
    [DemographicChoices.SingleWomen]: 'Single Women',
    [DemographicChoices.TayTeen]: 'TAY/Teen',
  };

export const enumDisplayEntryRequirementChoices: {
  [key in EntryRequirementChoices]: string;
} = {
  [EntryRequirementChoices.Background]: 'Background Check',
  [EntryRequirementChoices.HomelessVerification]:
    'Homeless Verification/Observation',
  [EntryRequirementChoices.InSpaOnly]: 'In-SPA Only',
  [EntryRequirementChoices.MedicaidOrMedicare]: 'Medicaid or Medicare',
  [EntryRequirementChoices.PhotoId]: 'Photo ID',
  [EntryRequirementChoices.Referral]: 'Referral',
  [EntryRequirementChoices.Reservation]: 'Reservation',
  [EntryRequirementChoices.VehicleRegistration]:
    'Vehicle Registration/Insurance',
  [EntryRequirementChoices.WalkUps]: 'Walk-Ups',
};

export const enumDisplayExitPolicyChoices: {
  [key in ExitPolicyChoices]: string;
} = {
  [ExitPolicyChoices.Mia]: 'Exit after 72 hours of being MIA',
  [ExitPolicyChoices.Violence]: 'Exit due to violence to self and others',
  [ExitPolicyChoices.Mitigation]:
    '30 Days Mitigation plan to post someone who exits',
  [ExitPolicyChoices.Other]: 'Other',
};

export const enumDisplayFunderChoices: { [key in FunderChoices]: string } = {
  [FunderChoices.CityOfLosAngeles]: 'City of Los Angeles',
  [FunderChoices.Dhs]: 'DHS',
  [FunderChoices.Dmh]: 'DMH',
  [FunderChoices.FederalFunding]: 'Federal Funding',
  [FunderChoices.Hopwa]: 'HOPWA',
  [FunderChoices.Lahsa]: 'LAHSA',
  [FunderChoices.Other]: 'Other',
  [FunderChoices.Private]: 'Private',
};

export const enumDisplayParkingChoices: { [key in ParkingChoices]: string } = {
  [ParkingChoices.Automobile]: 'Automobile',
  [ParkingChoices.Bicycle]: 'Bicycle',
  [ParkingChoices.Motorcycle]: 'Motorcycle',
  [ParkingChoices.NoParking]: 'No Parking',
  [ParkingChoices.Rv]: 'RV',
  [ParkingChoices.Street]: 'Street Parking',
};

export const enumDisplayPetChoices: { [key in PetChoices]: string } = {
  [PetChoices.Cats]: 'Cats',
  [PetChoices.DogsOver_25Lbs]: 'Dogs (> 25 lbs)',
  [PetChoices.DogsUnder_25Lbs]: 'Dogs (< 25 lbs)',
  [PetChoices.Exotics]: 'Exotics',
  [PetChoices.NoPetsAllowed]: 'No Pets Allowed',
  [PetChoices.PetArea]: 'Pet Area',
  [PetChoices.ServiceAnimals]: 'Service Animals',
};

export const enumDisplayReferralRequirementChoices: {
  [key in ReferralRequirementChoices]: string;
} = {
  [ReferralRequirementChoices.ReferralMatched]: 'Matched Referral',
  [ReferralRequirementChoices.ReferralNonmatched]: 'Non-Matched Referral',
  [ReferralRequirementChoices.ServiceProviderSubmission]:
    'Service Provider Submission',
  [ReferralRequirementChoices.SelfReferral]: 'Self Referral Option',
  [ReferralRequirementChoices.SameDayIntake]: 'Same Day Intake',
};

export const enumDisplayRoomStyles: { [key in RoomStyleChoices]: string } = {
  [RoomStyleChoices.Congregate]: 'Congregate (Open)',
  [RoomStyleChoices.CubicleHighWalls]: 'Cubicle High Walls',
  [RoomStyleChoices.CubicleLowWalls]: 'Cubicle Low Walls',
  [RoomStyleChoices.HighBunk]: 'High Bunk',
  [RoomStyleChoices.LowBunk]: 'Low Bunk',
  [RoomStyleChoices.MotelRoom]: 'Motel Room',
  [RoomStyleChoices.Other]: 'Other',
  [RoomStyleChoices.SharedRooms]: 'Shared Room',
  [RoomStyleChoices.SingleRoom]: 'Single Room',
};

export const enumDisplayShelterChoices: {
  [key in ShelterChoices]: string;
} = {
  [ShelterChoices.AccessCenter]: 'Access Center / Day Center',
  [ShelterChoices.Building]: 'Building',
  [ShelterChoices.Church]: 'Church',
  [ShelterChoices.HotelMotel]: 'Hotel/Motel',
  [ShelterChoices.Other]: 'Other',
  [ShelterChoices.SafeParking]: 'Safe Parking',
  [ShelterChoices.SingleFamilyHouse]: 'Single Family House',
  [ShelterChoices.TinyHomes]: 'Tiny Homes',
};

export const enumDisplayShelterProgramChoices: {
  [key in ShelterProgramChoices]: string;
} = {
  [ShelterProgramChoices.BridgeHome]: 'Bridge Home',
  [ShelterProgramChoices.CrisisHousing]: 'Crisis Housing',
  [ShelterProgramChoices.EmergencyShelter]: 'Emergency Shelter',
  [ShelterProgramChoices.FaithBased]: 'Faith Based',
  [ShelterProgramChoices.InterimHousing]: 'Interim Housing',
  [ShelterProgramChoices.Other]: 'Other',
  [ShelterProgramChoices.PermanentHousing]: 'Permanent Housing',
  [ShelterProgramChoices.ProjectHomeKey]: 'Project Home Key',
  [ShelterProgramChoices.RapidRehousing]: 'Rapid Rehousing',
  [ShelterProgramChoices.RecuperativeCare]: 'Recuperative Care',
  [ShelterProgramChoices.RoadmapHome]: 'Roadmap Home',
  [ShelterProgramChoices.SafeParkLa]: 'Safe Park LA',
  [ShelterProgramChoices.SoberLiving]: 'Sober Living',
  [ShelterProgramChoices.TinyHomeVillage]: 'Tiny Home Village',
  [ShelterProgramChoices.TransitionalHousing]: 'Transitional Housing',
  [ShelterProgramChoices.WinterShelter]: 'Winter Shelter',
};

export const enumDisplaySpaChoices: { [key in SpaChoices]: string } = {
  [SpaChoices.One]: '1 - Antelope Valley',
  [SpaChoices.Two]: '2 - San Fernando',
  [SpaChoices.Three]: '3 - San Gabriel',
  [SpaChoices.Four]: '4 - Metro',
  [SpaChoices.Five]: '5 - West',
  [SpaChoices.Six]: '6 - South',
  [SpaChoices.Seven]: '7 - East',
  [SpaChoices.Eight]: '8 - South Bay/Harbor',
};

export const enumDisplaySpecialSituationRestrictionChoices: {
  [key in SpecialSituationRestrictionChoices]: string;
} = {
  [SpecialSituationRestrictionChoices.DomesticViolence]: 'Domestic Violence',
  [SpecialSituationRestrictionChoices.HarmReduction]: 'Harm Reduction',
  [SpecialSituationRestrictionChoices.HivAids]: 'HIV/AIDS',
  [SpecialSituationRestrictionChoices.HumanTrafficking]: 'Human Trafficking',
  [SpecialSituationRestrictionChoices.JusticeSystems]: 'Justice Systems',
  [SpecialSituationRestrictionChoices.None]: 'None',
  [SpecialSituationRestrictionChoices.Veterans]: 'Veterans',
};

export const enumDisplayStorageChoices: { [key in StorageChoices]: string } = {
  [StorageChoices.AmnestyLockers]: 'Amnesty Lockers',
  [StorageChoices.NoStorage]: 'No Storage',
  [StorageChoices.SharedStorage]: 'Shared Storage',
  [StorageChoices.StandardLockers]: 'Standard Lockers',
  [StorageChoices.UnitStorage]: 'Unit-level Storage',
  [StorageChoices.PersonalBin]: 'Personal Storage Bin',
};

export const enumDisplayVaccinationRequirementChoices: {
  [key in VaccinationRequirementChoices]: string;
} = {
  [VaccinationRequirementChoices.Tb]: 'TB',
  [VaccinationRequirementChoices.Flu]: 'Flu',
  [VaccinationRequirementChoices.Covid_19]: 'COVID-19',
};

/*
 * Must match CITY_COUNCIL_DISTRICT_CHOICES in apps/betterangels-backend/shelters/enums.py
 */
export const CITY_COUNCIL_DISTRICT_UNINCORPORATED = 0;
export function formatCityCouncilDistrict(
  district: number | null | undefined
): string {
  if (district == null) return '';
  if (district === CITY_COUNCIL_DISTRICT_UNINCORPORATED)
    return 'Unincorporated';
  return String(district);
}
