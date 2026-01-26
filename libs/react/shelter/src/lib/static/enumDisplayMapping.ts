import {
  AccessibilityChoices,
  DemographicChoices,
  EntryRequirementChoices,
  FunderChoices,
  GeneralServiceChoices,
  ParkingChoices,
  PetChoices,
  RoomStyleChoices,
  ShelterChoices,
  ShelterProgramChoices,
  SpaChoices,
  SpecialSituationRestrictionChoices,
  StorageChoices,
} from '../apollo';

export const enumDisplayDemographics: { [key in DemographicChoices]: string } =
  {
    [DemographicChoices.All]: 'All',
    [DemographicChoices.Families]: 'Families',
    [DemographicChoices.LgbtqPlus]: 'LGBTQ+',
    [DemographicChoices.Other]: 'Others',
    [DemographicChoices.Seniors]: 'Seniors',
    [DemographicChoices.SingleDads]: 'Single Dads',
    [DemographicChoices.SingleMen]: 'Single Men',
    [DemographicChoices.SingleMoms]: 'Single Moms',
    [DemographicChoices.SingleWomen]: 'Single Women',
    [DemographicChoices.TayTeen]: 'TAY/Teen',
  };

export const enumDisplayGeneralServiceChoices: {
  [key in GeneralServiceChoices]: string;
} = {
  [GeneralServiceChoices.CaseManagement]: 'Case Management',
  [GeneralServiceChoices.Childcare]: 'Childcare',
  [GeneralServiceChoices.ComputerAccess]: 'Computer Access',
  [GeneralServiceChoices.EmploymentServices]: 'Employment Services',
  [GeneralServiceChoices.FinancialLiteracyAssistance]:
    'Financial Literacy Assistance',
  [GeneralServiceChoices.HousingNavigation]: 'Housing Navigation',
  [GeneralServiceChoices.LegalAssistance]: 'Legal Assistance',
  [GeneralServiceChoices.Laundry]: 'Laundry Services',
  [GeneralServiceChoices.Mail]: 'Mail',
  [GeneralServiceChoices.Phone]: 'Phone',
  [GeneralServiceChoices.Tls]: 'TLS (Time Limited Subsidies)',
  [GeneralServiceChoices.Transportation]: 'Transportation',
};

export const enumDisplayEntryRequirementChoices: {
  [key in EntryRequirementChoices]: string;
} = {
  [EntryRequirementChoices.Background]: 'Background Check',
  [EntryRequirementChoices.HomelessVerification]:
    'Homeless Verification/Observation',
  [EntryRequirementChoices.MedicaidOrMedicare]: 'Medicaid or Medicare',
  [EntryRequirementChoices.PhotoId]: 'Photo ID',
  [EntryRequirementChoices.Referral]: 'Referral',
  [EntryRequirementChoices.Reservation]: 'Reservation',
  [EntryRequirementChoices.VehicleRegistration]:
    'Vehicle Registration/Insurance',
  [EntryRequirementChoices.WalkUps]: 'Walk-Ups',
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

export const enumDisplayShelterChoices: {
  [key in ShelterChoices]: string;
} = {
  [ShelterChoices.Building]: 'Building',
  [ShelterChoices.Church]: 'Church',
  [ShelterChoices.HotelMotel]: 'Hotel/Motel',
  [ShelterChoices.Other]: 'Other',
  [ShelterChoices.SafeParking]: 'Safe Parking',
  [ShelterChoices.SingleFamilyHouse]: 'Single Family House',
  [ShelterChoices.TinyHomes]: 'Tiny Homes',
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

export const enumDisplayAccessibilityChoices: {
  [key in AccessibilityChoices]: string;
} = {
  [AccessibilityChoices.AdaRooms]: 'ADA Rooms Available',
  [AccessibilityChoices.MedicalEquipmentPermitted]:
    'Medical Equipment Permitted',
  [AccessibilityChoices.WheelchairAccessible]: 'Wheelchair Accessible',
};

export const enumDisplayStorageChoices: { [key in StorageChoices]: string } = {
  [StorageChoices.AmnestyLockers]: 'Amnesty Lockers',
  [StorageChoices.NoStorage]: 'No Storage',
  [StorageChoices.SharedStorage]: 'Shared Storage',
  [StorageChoices.StandardLockers]: 'Standard Lockers',
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

export const enumDisplayParkingChoices: { [key in ParkingChoices]: string } = {
  [ParkingChoices.Automobile]: 'Automobile',
  [ParkingChoices.Bicycle]: 'Bicycle',
  [ParkingChoices.Motorcycle]: 'Motorcycle',
  [ParkingChoices.NoParking]: 'No Parking',
  [ParkingChoices.Rv]: 'RV',
};

export const enumDisplaySpaChoices: { [key in SpaChoices]: string } = {
  [SpaChoices.Eight]: '8',
  [SpaChoices.Five]: '5',
  [SpaChoices.Four]: '4',
  [SpaChoices.One]: '1',
  [SpaChoices.Seven]: '7',
  [SpaChoices.Six]: '6',
  [SpaChoices.Three]: '3',
  [SpaChoices.Two]: '2',
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

/**
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
