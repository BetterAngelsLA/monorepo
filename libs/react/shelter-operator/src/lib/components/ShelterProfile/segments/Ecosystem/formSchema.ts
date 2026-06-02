import { z } from 'zod';
import { ShelterProfileType } from '../../types';

const ecosystemOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const formSchema = z.object({
  city: ecosystemOptionSchema.nullable().optional(),
  spa: ecosystemOptionSchema.nullable().optional(),
  citiesServed: z.array(ecosystemOptionSchema),
  spasServed: z.array(ecosystemOptionSchema),
});

export type EcosystemFormData = z.infer<typeof formSchema>;

export const defaultFormValues: EcosystemFormData = {
  city: null,
  spa: null,
  citiesServed: [],
  spasServed: [],
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
  };
}
