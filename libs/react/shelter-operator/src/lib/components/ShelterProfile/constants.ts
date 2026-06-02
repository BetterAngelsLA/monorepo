import {
  enumDisplayAccessibilityChoices,
  enumDisplayExitPolicyChoices,
  enumDisplayFunderChoices,
  enumDisplayParkingChoices,
  enumDisplayPetChoices,
  enumDisplayShelterProgramChoices,
  enumDisplayStorageChoices,
  enumStatusChoices,
  ExitPolicyChoices,
  FunderChoices,
  ParkingChoices,
  PetChoices,
  ShelterProgramChoices,
  StatusChoices,
  StorageChoices,
} from '@monorepo/react/shelter';
import { toDropdownOptions } from '../base-ui/dropdown';

export const SEARCHABLE_MIN = 5;

export const ACCESSIBILITY_OPTIONS = toDropdownOptions(
  enumDisplayAccessibilityChoices
);

export const STATUS_OPTIONS = toDropdownOptions(enumStatusChoices);

export const STORAGE_OPTIONS = toDropdownOptions(enumDisplayStorageChoices, [
  StorageChoices.NoStorage,
]);

export const PETS_OPTIONS = toDropdownOptions(enumDisplayPetChoices, [
  PetChoices.NoPetsAllowed,
]);

export const PARKING_OPTIONS = toDropdownOptions(enumDisplayParkingChoices, [
  ParkingChoices.NoParking,
]);

export const EXIT_POLICY_OPTIONS = toDropdownOptions(
  enumDisplayExitPolicyChoices,
  [ExitPolicyChoices.Other]
);

export const SHELTER_PROGRAMS_OPTIONS = toDropdownOptions(
  enumDisplayShelterProgramChoices,
  [ShelterProgramChoices.Other]
);

export const FUNDERS_OPTIONS = toDropdownOptions(enumDisplayFunderChoices, [
  FunderChoices.Other,
]);

export const LA_CITY_COUNCIL_DISTRICT_OPTIONS = [
  { value: 0, label: 'None' },
  ...buildNumericOptions(15),
] as const;

export const LA_SUPERVISORIAL_DISTRICT_OPTIONS = [
  { value: 0, label: 'None' },
  ...buildNumericOptions(5),
] as const;

export const BOOLEAN_OPTIONS_WITH_UNKNOWN = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
  { value: 'null', label: 'Unknown' },
] as const;

export const STATUS_COLOR_MAP: Record<StatusChoices, string> = {
  [StatusChoices.Draft]: 'bg-gray-100 text-gray-700',
  [StatusChoices.Pending]: 'bg-amber-100 text-amber-700',
  [StatusChoices.Approved]: 'bg-green-100 text-green-700',
  [StatusChoices.Inactive]: 'bg-red-100 text-red-700',
};

// utils

function buildNumericOptions(maxValue: number) {
  return Array.from({ length: maxValue }, (_, index) => ({
    value: index + 1,
    label: String(index + 1),
  }));
}
