import {
  enumDisplayAccessibilityChoices,
  enumDisplayExitPolicyChoices,
  enumDisplayParkingChoices,
  enumDisplayPetChoices,
  enumDisplayStorageChoices,
  enumStatusChoices,
  ExitPolicyChoices,
  ParkingChoices,
  PetChoices,
  StatusChoices,
  StorageChoices,
} from '@monorepo/react/shelter';
import { toDropdownOptions } from '../base-ui/dropdown';

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

export const STATUS_COLOR_MAP: Record<StatusChoices, string> = {
  [StatusChoices.Draft]: 'bg-gray-100 text-gray-700',
  [StatusChoices.Pending]: 'bg-amber-100 text-amber-700',
  [StatusChoices.Approved]: 'bg-green-100 text-green-700',
  [StatusChoices.Inactive]: 'bg-red-100 text-red-700',
};

export const BOOLEAN_OPTIONS_WITH_UNKNOWN = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
  { value: 'null', label: 'Unknown' },
] as const;
