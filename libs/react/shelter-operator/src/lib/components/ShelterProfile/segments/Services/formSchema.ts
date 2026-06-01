import { z } from 'zod';
import { ShelterProfileType } from '../../types';

export const formSchema = z.object({
  otherRules: z.string().nullable().optional(),
});

export type ServicesFormData = z.infer<typeof formSchema>;

export const defaultFormValues: ServicesFormData = {
  otherRules: undefined,
};

export function toFormData(shelter: ShelterProfileType): ServicesFormData {
  return {
    otherRules: shelter.otherRules,
  };
}
