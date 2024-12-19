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

export type TShelterFilterOption = {
  label: string;
  value: string;
};

// Demographic
const demographicOptions = [
  DemographicChoices.All,
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

export const demographicFilter = {
  name: 'demographicFilter',
  header: 'Demographic',
  options: demographicOptionList,
  selectAllKey: DemographicChoices.All,
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

export const specialSituationFilter = {
  name: 'specialSituationFilter',
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

export const shelterTypeFilter = {
  name: 'shelterTypeFilter',
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

export const roomStyleFilter = {
  name: 'roomStyleFilter',
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

export const petsFilter = {
  name: 'petsFilter',
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

export const parkingFilter = {
  name: 'parkingFilter',
  header: 'Parking',
  options: parkingOptionsList,
};
