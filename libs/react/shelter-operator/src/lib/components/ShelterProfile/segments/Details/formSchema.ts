import {
  AccessibilityChoices,
  ParkingChoices,
  PetChoices,
  StorageChoices,
} from '@monorepo/react/shelter';
import { z } from 'zod';
import { toDropdownValues } from '../../../base-ui/dropdown';
import { ShelterProfileType } from '../../types';

export const detailsFormSchema = z.object({
  accessibility: z.array(z.enum(AccessibilityChoices)),
  storage: z.array(z.enum(StorageChoices)),
  pets: z.array(z.enum(PetChoices)),
  parking: z.array(z.enum(ParkingChoices)),
  addNotesShelterDetails: z.string(),
});

export type DetailsFormData = z.infer<typeof detailsFormSchema>;

export const detailsDefaultValues: DetailsFormData = {
  accessibility: [],
  storage: [],
  pets: [],
  parking: [],
  addNotesShelterDetails: '',
};

export function toFormData(shelter: ShelterProfileType): DetailsFormData {
  return {
    accessibility: toDropdownValues(shelter.accessibility),
    storage: toDropdownValues(shelter.storage),
    pets: toDropdownValues(shelter.pets),
    parking: toDropdownValues(shelter.parking),
    addNotesShelterDetails: shelter.addNotesShelterDetails ?? '',
  };
}
