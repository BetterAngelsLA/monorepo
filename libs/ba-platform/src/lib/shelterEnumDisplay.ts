/**
 * Display labels for the shelter enum vocabularies that both shelter-web and the
 * mobile app render (attribute matching, shelter cards, pickers).
 *
 * The labels are user-facing copy shared by two surfaces, so they live here —
 * platform-neutral — instead of being copied per app, where they drifted apart
 * by design. Change a label here and both surfaces change together.
 */
import {
  AccessibilityChoices,
  DemographicChoices,
  ParkingChoices,
  PetChoices,
  SpecialSituationRestrictionChoices,
  StorageChoices,
} from '../types';

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

export const enumDisplayPetChoices: { [key in PetChoices]: string } = {
  [PetChoices.Cats]: 'Cats',
  [PetChoices.DogsOver_25Lbs]: 'Dogs (> 25 lbs)',
  [PetChoices.DogsUnder_25Lbs]: 'Dogs (< 25 lbs)',
  [PetChoices.Exotics]: 'Exotics',
  [PetChoices.NoPetsAllowed]: 'No Pets Allowed',
  [PetChoices.PetArea]: 'Pet Area',
  [PetChoices.ServiceAnimals]: 'Service Animals',
};

export const enumDisplayStorageChoices: {
  [key in StorageChoices]: string;
} = {
  [StorageChoices.AmnestyLockers]: 'Amnesty Lockers',
  [StorageChoices.NoStorage]: 'No Storage',
  [StorageChoices.PersonalBin]: 'Personal Storage Bin',
  [StorageChoices.SharedStorage]: 'Shared Storage',
  [StorageChoices.StandardLockers]: 'Standard Lockers',
  [StorageChoices.UnitStorage]: 'Unit-level Storage',
};

export const enumDisplayParkingChoices: {
  [key in ParkingChoices]: string;
} = {
  [ParkingChoices.Automobile]: 'Automobile',
  [ParkingChoices.Bicycle]: 'Bicycle',
  [ParkingChoices.Motorcycle]: 'Motorcycle',
  [ParkingChoices.NoParking]: 'No Parking',
  [ParkingChoices.Rv]: 'RV',
  [ParkingChoices.Street]: 'Street Parking',
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
