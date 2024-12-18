import {
  AccessibilityChoices,
  CityChoices,
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

export const enumDisplayAccessibilityChoices: {
  [key in AccessibilityChoices]: string;
} = {
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
  [PetChoices.ServiceAnimals]: 'Service Animals',
};

export const enumDisplayParkingChoices: { [key in ParkingChoices]: string } = {
  [ParkingChoices.Automobile]: 'Automobile',
  [ParkingChoices.Bicycle]: 'Bicycle',
  [ParkingChoices.Motorcycle]: 'Motorcycle',
  [ParkingChoices.NoParking]: 'No Parking',
  [ParkingChoices.Rv]: 'RV',
};

export const enumDisplayCityChoices: { [key in CityChoices]: string } = {
  [CityChoices.AgouraHills]: 'Agoura Hills',
  [CityChoices.Alhambra]: 'Alhambra',
  [CityChoices.Arcadia]: 'Arcadia',
  [CityChoices.Artesia]: 'Artesia',
  [CityChoices.Avalon]: 'Avalon',
  [CityChoices.Azusa]: 'Azusa',
  [CityChoices.BaldwinPark]: 'Baldwin Park',
  [CityChoices.Bell]: 'Bell',
  [CityChoices.BellGardens]: 'Bell Gardens',
  [CityChoices.Bellflower]: 'Bellflower',
  [CityChoices.BeverlyHills]: 'Beverly Hills',
  [CityChoices.Bradbury]: 'Bradbury',
  [CityChoices.Burbank]: 'Burbank',
  [CityChoices.Calabasas]: 'Calabasas',
  [CityChoices.Carson]: 'Carson',
  [CityChoices.Cerritos]: 'Cerritos',
  [CityChoices.Claremont]: 'Claremont',
  [CityChoices.Commerce]: 'Commerce',
  [CityChoices.Compton]: 'Compton',
  [CityChoices.Covina]: 'Covina',
  [CityChoices.Cudahy]: 'Cudahy',
  [CityChoices.CulverCity]: 'Culver City',
  [CityChoices.DiamondBar]: 'Diamond Bar',
  [CityChoices.Downey]: 'Downey',
  [CityChoices.Duarte]: 'Duarte',
  [CityChoices.ElMonte]: 'El Monte',
  [CityChoices.ElSegundo]: 'El Segundo',
  [CityChoices.Gardena]: 'Gardena',
  [CityChoices.Glendale]: 'Glendale',
  [CityChoices.Glendora]: 'Glendora',
  [CityChoices.HawaiianGardens]: 'Hawaiian Gardens',
  [CityChoices.Hawthorne]: 'Hawthorne',
  [CityChoices.HermosaBeach]: 'Hermosa Beach',
  [CityChoices.HiddenHills]: 'Hidden Hills',
  [CityChoices.Hollywood]: 'Hollywood',
  [CityChoices.HuntingtonPark]: 'Huntington Park',
  [CityChoices.Industry]: 'Industry',
  [CityChoices.Inglewood]: 'Inglewood',
  [CityChoices.Irwindale]: 'Irwindale',
  [CityChoices.LaCanadaFlintridge]: 'La Canada Flintridge',
  [CityChoices.LaHabraHeights]: 'La Habra Heights',
  [CityChoices.LaMirada]: 'La Mirada',
  [CityChoices.LaPuente]: 'La Puente',
  [CityChoices.LaVerne]: 'La Verne',
  [CityChoices.Lakewood]: 'Lakewood',
  [CityChoices.Lancaster]: 'Lancaster',
  [CityChoices.Lawndale]: 'Lawndale',
  [CityChoices.Lomita]: 'Lomita',
  [CityChoices.LongBeach]: 'Long Beach',
  [CityChoices.LosAngeles]: 'Los Angeles',
  [CityChoices.Lynwood]: 'Lynwood',
  [CityChoices.Malibu]: 'Malibu',
  [CityChoices.ManhattanBeach]: 'Manhattan Beach',
  [CityChoices.Maywood]: 'Maywood',
  [CityChoices.Monrovia]: 'Monrovia',
  [CityChoices.Montebello]: 'Montebello',
  [CityChoices.MontereyPark]: 'Monterey Park',
  [CityChoices.Norwalk]: 'Norwalk',
  [CityChoices.Palmdale]: 'Palmdale',
  [CityChoices.PalosVerdesEstates]: 'Palos Verdes Estates',
  [CityChoices.Paramount]: 'Paramount',
  [CityChoices.Pasadena]: 'Pasadena',
  [CityChoices.PicoRivera]: 'Pico Rivera',
  [CityChoices.Pomona]: 'Pomona',
  [CityChoices.RanchoPalosVerdes]: 'Rancho Palos Verdes',
  [CityChoices.RedondoBeach]: 'Redondo Beach',
  [CityChoices.RollingHills]: 'Rolling Hills',
  [CityChoices.RollingHillsEstates]: 'Rolling Hills Estates',
  [CityChoices.Rosemead]: 'Rosemead',
  [CityChoices.SanDimas]: 'San Dimas',
  [CityChoices.SanFernando]: 'San Fernando',
  [CityChoices.SanGabriel]: 'San Gabriel',
  [CityChoices.SanMarino]: 'San Marino',
  [CityChoices.SantaClarita]: 'Santa Clarita',
  [CityChoices.SantaFeSprings]: 'Santa Fe Springs',
  [CityChoices.SantaMonica]: 'Santa Monica',
  [CityChoices.SierraMadre]: 'Sierra Madre',
  [CityChoices.SignalHill]: 'Signal Hill',
  [CityChoices.SouthElMonte]: 'South El Monte',
  [CityChoices.SouthGate]: 'South Gate',
  [CityChoices.SouthPasadena]: 'South Pasadena',
  [CityChoices.TempleCity]: 'Temple City',
  [CityChoices.Torrance]: 'Torrance',
  [CityChoices.Venice]: 'Venice',
  [CityChoices.Vernon]: 'Vernon',
  [CityChoices.Walnut]: 'Walnut',
  [CityChoices.WestCovina]: 'West Covina',
  [CityChoices.WestHollywood]: 'West Hollywood',
  [CityChoices.WestlakeVillage]: 'Westlake Village',
  [CityChoices.WestLosAngeles]: 'West Los Angeles',
  [CityChoices.Whittier]: 'Whittier',
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
