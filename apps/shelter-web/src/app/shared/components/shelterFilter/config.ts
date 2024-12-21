import {
  DemographicChoices,
  ParkingChoices,
  PetChoices,
  RoomStyleChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
  enumDisplayDemographics,
  enumDisplayParkingChoices,
  enumDisplayPetChoices,
  enumDisplayRoomStyles,
  enumDisplayShelterChoices,
  enumDisplaySpecialSituationRestrictionChoices,
} from '@monorepo/react/shelter';
import { TShelterPropertyFilters } from '../shelters/sheltersDisplay';

export type TFilterOptionType =
  | PetChoices
  | DemographicChoices
  | SpecialSituationRestrictionChoices
  | ShelterChoices
  | RoomStyleChoices
  | ParkingChoices;

export type TShelterFilterOption = {
  label: string;
  value: TFilterOptionType;
};

export type TFilterConfig = {
  name: keyof TShelterPropertyFilters;
  header: string;
  options: TShelterFilterOption[];
};

export function getFilterLabel(
  category: keyof TShelterPropertyFilters,
  value: TFilterOptionType
): string | null {
  switch (category) {
    case 'demographics':
      return enumDisplayDemographics[value as DemographicChoices] || null;
    case 'pets':
      return enumDisplayPetChoices[value as PetChoices] || null;
    case 'specialSituationRestrictions':
      return (
        enumDisplaySpecialSituationRestrictionChoices[
          value as SpecialSituationRestrictionChoices
        ] || null
      );
    case 'shelterType':
      return enumDisplayShelterChoices[value as ShelterChoices] || null;
    case 'roomStyle':
      return enumDisplayRoomStyles[value as RoomStyleChoices] || null;
    case 'parking':
      return enumDisplayParkingChoices[value as ParkingChoices] || null;
    default:
      return null;
  }
}

// Demographic
const demographicOptions = [
  DemographicChoices.SingleMen,
  DemographicChoices.SingleWomen,
  DemographicChoices.TayTeen,
  DemographicChoices.Seniors,
  DemographicChoices.Families,
  DemographicChoices.SingleMoms,
  DemographicChoices.Other,
];

const demographicOptionList: TShelterFilterOption[] = demographicOptions.map(
  (option) => {
    return {
      label: enumDisplayDemographics[option],
      value: option,
    };
  }
);

export const demographicFilter: TFilterConfig = {
  name: 'demographics',
  header: 'Demographic',
  options: demographicOptionList,
};

// Special Situation
const specialSituationOptions = [
  SpecialSituationRestrictionChoices.DomesticViolence,
  SpecialSituationRestrictionChoices.HivAids,
  SpecialSituationRestrictionChoices.HumanTrafficking,
  SpecialSituationRestrictionChoices.JusticeSystems,
  SpecialSituationRestrictionChoices.LgbtqPlus,
  SpecialSituationRestrictionChoices.Veterans,
  SpecialSituationRestrictionChoices.None,
];

const specialSituationOptionsOptionList: TShelterFilterOption[] =
  specialSituationOptions.map((option) => {
    return {
      label: enumDisplaySpecialSituationRestrictionChoices[option],
      value: option,
    };
  });

export const specialSituationFilter: TFilterConfig = {
  name: 'specialSituationRestrictions',
  header: 'Special Situation Restriction',
  options: specialSituationOptionsOptionList,
};

// Shelter Type
const shelterTypeOptions = [
  ShelterChoices.Building,
  ShelterChoices.Church,
  ShelterChoices.HotelMotel,
  ShelterChoices.SafeParking,
  ShelterChoices.SingleFamilyHouse,
  ShelterChoices.TinyHomes,
  ShelterChoices.Other,
];

const shelterTypeOptionsList: TShelterFilterOption[] = shelterTypeOptions.map(
  (option) => {
    return {
      label: enumDisplayShelterChoices[option],
      value: option,
    };
  }
);

export const shelterTypeFilter: TFilterConfig = {
  name: 'shelterType',
  header: 'Shelter Type',
  options: shelterTypeOptionsList,
};

// Room Style
const roomStyleOptions = [
  RoomStyleChoices.Congregant,
  RoomStyleChoices.CubicleHighWalls,
  RoomStyleChoices.CubicleLowWalls,
  RoomStyleChoices.MotelRoom,
  RoomStyleChoices.SharedRooms,
  RoomStyleChoices.SingleRoom,
  RoomStyleChoices.Other,
];

const roomStyleOptionsList: TShelterFilterOption[] = roomStyleOptions.map(
  (option) => {
    return {
      label: enumDisplayRoomStyles[option],
      value: option,
    };
  }
);

export const roomStyleFilter: TFilterConfig = {
  name: 'roomStyle',
  header: 'Room Style',
  options: roomStyleOptionsList,
};

// Pets
const petsOptions = [
  PetChoices.Cats,
  PetChoices.DogsOver_25Lbs,
  PetChoices.DogsUnder_25Lbs,
  PetChoices.ServiceAnimals,
  PetChoices.Exotics,
  PetChoices.NoPetsAllowed,
];

const petsOptionsList: TShelterFilterOption[] = petsOptions.map((option) => {
  return {
    label: enumDisplayPetChoices[option],
    value: option,
  };
});

export const petsFilter: TFilterConfig = {
  name: 'pets',
  header: 'Pets',
  options: petsOptionsList,
};

// Parking
const parkingOptions = [
  ParkingChoices.Automobile,
  ParkingChoices.Bicycle,
  ParkingChoices.Motorcycle,
  ParkingChoices.NoParking,
  ParkingChoices.Rv,
];

const parkingOptionsList: TShelterFilterOption[] = parkingOptions.map(
  (option) => {
    return {
      label: enumDisplayParkingChoices[option],
      value: option,
    };
  }
);

export const parkingFilter: TFilterConfig = {
  name: 'parking',
  header: 'Parking',
  options: parkingOptionsList,
};
