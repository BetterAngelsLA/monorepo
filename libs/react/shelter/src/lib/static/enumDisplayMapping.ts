import {
  DemographicChoices,
  EntryRequirementChoices,
  GeneralServiceChoices,
  RoomStyleChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
} from '../apollo';

export const enumDisplayDemographics: { [key in DemographicChoices]: string } =
  {
    [DemographicChoices.All]: 'All',
    [DemographicChoices.Families]: 'Families',
    [DemographicChoices.Other]: 'Other',
    [DemographicChoices.Seniors]: 'Seniors',
    [DemographicChoices.SingleMen]: 'Single Man',
    [DemographicChoices.SingleMoms]: 'Single Moms',
    [DemographicChoices.SingleWomen]: 'Single Woman',
    [DemographicChoices.TayTeen]: 'Tay Teen',
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
  [GeneralServiceChoices.Mail]: 'Mail',
  [GeneralServiceChoices.Phone]: 'Phone',
  [GeneralServiceChoices.Transportation]: 'Transportation',
};

export const enumDisplayEntryRequirementChoices: {
  [key in EntryRequirementChoices]: string;
} = {
  [EntryRequirementChoices.MedicaidOrMedicare]: 'Medicaid or Medicare',
  [EntryRequirementChoices.PhotoId]: 'Photo ID',
  [EntryRequirementChoices.Referral]: 'Referral',
  [EntryRequirementChoices.Reservation]: 'Reservation',
};

export const enumDisplaySpecialSituationRestrictionChoices: {
  [key in SpecialSituationRestrictionChoices]: string;
} = {
  [SpecialSituationRestrictionChoices.DomesticViolence]: 'Domestic Violence',
  [SpecialSituationRestrictionChoices.HivAids]: 'HIV/AIDS',
  [SpecialSituationRestrictionChoices.HumanTrafficking]: 'Human Trafficking',
  [SpecialSituationRestrictionChoices.JusticeSystems]: 'Justice Systems',
  [SpecialSituationRestrictionChoices.LgbtqPlus]: 'LGBTQ+',
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
  [RoomStyleChoices.Congregant]: 'Congregant',
  [RoomStyleChoices.CubicleHighWalls]: 'Cubicle High Walls',
  [RoomStyleChoices.CubicleLowWalls]: 'Cubicle Low Walls',
  [RoomStyleChoices.MotelRoom]: 'Motel Room',
  [RoomStyleChoices.Other]: 'Other',
  [RoomStyleChoices.SharedRooms]: 'Shared Room',
  [RoomStyleChoices.SingleRoom]: 'Single Room',
};
