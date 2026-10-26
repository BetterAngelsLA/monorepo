import { FunderChoices, ShelterProgramChoices } from '@monorepo/react/shelter';
import { z } from 'zod';
import { toDropdownValues } from '../../../base-ui/dropdown';
import { ShelterProfileType } from '../../types';

const ecosystemOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const baseSchema = z.object({
  city: ecosystemOptionSchema.nullable().optional(),
  spa: ecosystemOptionSchema.nullable().optional(),
  citiesServed: z.array(ecosystemOptionSchema),
  spasServed: z.array(ecosystemOptionSchema),
  cityCouncilDistrict: z.number().nullable().optional(),
  supervisorialDistrict: z.number().nullable().optional(),
  shelterPrograms: z.array(z.enum(ShelterProgramChoices)),
  shelterProgramsOther: z.string().trim().nullable().optional(),
  funders: z.array(z.enum(FunderChoices)),
  fundersOther: z.string().trim().nullable().optional(),
});

export const formSchema = baseSchema.superRefine((data, ctx) => {
  if (
    data.shelterPrograms.includes(ShelterProgramChoices.Other) &&
    !data.shelterProgramsOther?.trim()
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['shelterProgramsOther'],
      message: "This field is required when 'Other' is selected.",
    });
  }

  if (
    data.funders.includes(FunderChoices.Other) &&
    !data.fundersOther?.trim()
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['fundersOther'],
      message: "This field is required when 'Other' is selected.",
    });
  }
});

export type EcosystemFormData = z.infer<typeof formSchema>;

export const formFieldNames = Object.keys(baseSchema.shape);

export const defaultFormValues: EcosystemFormData = {
  city: null,
  spa: null,
  citiesServed: [],
  spasServed: [],
  cityCouncilDistrict: null,
  supervisorialDistrict: null,
  shelterPrograms: [],
  shelterProgramsOther: undefined,
  funders: [],
  fundersOther: undefined,
};

export function toFormData(shelter: ShelterProfileType): EcosystemFormData {
  return {
    city: shelter.city
      ? { id: shelter.city.id, name: shelter.city.name }
      : null,
    spa: shelter.spa ? { id: shelter.spa.id, name: shelter.spa.name } : null,
    citiesServed: shelter.citiesServed.map((city) => ({
      id: city.id,
      name: city.name,
    })),
    spasServed: shelter.spasServed.map((spa) => ({
      id: spa.id,
      name: spa.name,
    })),
    cityCouncilDistrict: shelter.cityCouncilDistrict,
    supervisorialDistrict: shelter.supervisorialDistrict,
    shelterPrograms: toDropdownValues(shelter.shelterPrograms),
    shelterProgramsOther: shelter.shelterProgramsOther,
    funders: toDropdownValues(shelter.funders),
    fundersOther: shelter.fundersOther,
  };
}
