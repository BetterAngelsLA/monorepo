import { z } from 'zod';
import { HmisGenderEnum } from '../../../../apollo';

export type TFormSchema = z.infer<typeof FormSchema>;

export const emptyState: TFormSchema = {
  gender: [],
  additionalRaceEthnicity: '',
  differentIdentityText: '',
};

export const FormSchema = z.object({
  gender: z.array(z.enum(HmisGenderEnum)).default([]),
  additionalRaceEthnicity: z.string(),
  differentIdentityText: z.string(),
});
