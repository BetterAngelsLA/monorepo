import {
  AccessibilityChoices,
  DemographicChoices,
  ParkingChoices,
  PetChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
  StorageChoices,
} from '@monorepo/react/shelter';
import { z } from 'zod';
import { toDropdownValues } from '../../../base-ui/dropdown';
import { ShelterProfileType } from '../../types';

const baseSchema = z.object({
  demographics: z.array(z.enum(DemographicChoices)),
  demographicsOther: z.string().trim().nullable().optional(),
  specialSituationRestrictions: z.array(
    z.enum(SpecialSituationRestrictionChoices),
  ),
  shelterTypes: z.array(z.enum(ShelterChoices)),
  shelterTypesOther: z.string().trim().nullable().optional(),
  accessibility: z.array(z.enum(AccessibilityChoices)),
  storage: z.array(z.enum(StorageChoices)),
  pets: z.array(z.enum(PetChoices)),
  parking: z.array(z.enum(ParkingChoices)),
  addNotesShelterDetails: z.string(), // RichTextEditor field
});

export const formSchema = baseSchema.superRefine((data, ctx) => {
  // `other` fields already trimmed via baseSchema
  if (
    data.demographics.includes(DemographicChoices.Other) &&
    !data.demographicsOther
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['demographicsOther'],
      message: "This field is required when 'Other' is selected.",
    });
  }

  if (
    data.shelterTypes.includes(ShelterChoices.Other) &&
    !data.shelterTypesOther
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['shelterTypesOther'],
      message: "This field is required when 'Other' is selected.",
    });
  }
});

export type DetailsFormData = z.infer<typeof formSchema>;

export const formFieldNames = Object.keys(baseSchema.shape);

export const defaultFormValues: DetailsFormData = {
  demographics: [],
  demographicsOther: undefined,
  specialSituationRestrictions: [],
  shelterTypes: [],
  shelterTypesOther: undefined,
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
    specialSituationRestrictions: toDropdownValues(
      shelter.specialSituationRestrictions,
    ),
    shelterTypes: toDropdownValues(shelter.shelterTypes),
    shelterTypesOther: shelter.shelterTypesOther,
    accessibility: toDropdownValues(shelter.accessibility),
    storage: toDropdownValues(shelter.storage),
    pets: toDropdownValues(shelter.pets),
    parking: toDropdownValues(shelter.parking),
    addNotesShelterDetails: shelter.addNotesShelterDetails ?? '',
  };
}
