import { z } from 'zod';
import { ShelterProfileType } from '../../types';

export const formSchema = z.object({
  services: z.array(z.string()),
});

export type ServicesFormData = z.infer<typeof formSchema>;

export const defaultFormValues: ServicesFormData = {
  services: [],
};

export function toFormData(shelter: ShelterProfileType): ServicesFormData {
  return {
    services: shelter.services.map((service) => service.id),
  };
}
