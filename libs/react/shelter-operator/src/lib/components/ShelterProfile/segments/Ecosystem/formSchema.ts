import { z } from 'zod';
import { ShelterProfileType } from '../../types';

const ecosystemOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const formSchema = z.object({
  city: ecosystemOptionSchema.nullable().optional(),
  spa: ecosystemOptionSchema.nullable().optional(),
});

export type EcosystemFormData = z.infer<typeof formSchema>;

export const defaultFormValues: EcosystemFormData = {
  city: null,
  spa: null,
};

export function toFormData(shelter: ShelterProfileType): EcosystemFormData {
  return {
    city: shelter.city
      ? { id: shelter.city.id, name: shelter.city.name }
      : null,
    spa: shelter.spa ? { id: shelter.spa.id, name: shelter.spa.name } : null,
    // citiesServed: shelter.
  };
}
