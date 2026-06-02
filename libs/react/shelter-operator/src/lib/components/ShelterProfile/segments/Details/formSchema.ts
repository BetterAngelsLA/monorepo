import {
  AccessibilityChoices,
  DemographicChoices,
  ParkingChoices,
  PetChoices,
  StorageChoices,
} from '@monorepo/react/shelter';
import { z } from 'zod';
import { toDropdownValues } from '../../../base-ui/dropdown';
import { ShelterProfileType } from '../../types';

export const detailsFormSchema = z.object({
  demographics: z.array(z.enum(DemographicChoices)),
  demographicsOther: z.string().nullable().optional(),
  accessibility: z.array(z.enum(AccessibilityChoices)),
  storage: z.array(z.enum(StorageChoices)),
  pets: z.array(z.enum(PetChoices)),
  parking: z.array(z.enum(ParkingChoices)),
  addNotesShelterDetails: z.string(),
});

export type DetailsFormData = z.infer<typeof detailsFormSchema>;

export const detailsDefaultValues: DetailsFormData = {
  demographics: [],
  demographicsOther: undefined,
  accessibility: [],
  storage: [],
  pets: [],
  parking: [],
  addNotesShelterDetails: '',
};

export function toFormData(shelter: ShelterProfileType): DetailsFormData {
  return {
    demographics: toDropdownValues(shelter.demographics),
    demographicsOther: shelter.demographicsOther,
    accessibility: toDropdownValues(shelter.accessibility),
    storage: toDropdownValues(shelter.storage),
    pets: toDropdownValues(shelter.pets),
    parking: toDropdownValues(shelter.parking),
    addNotesShelterDetails: shelter.addNotesShelterDetails ?? '',
  };
}
