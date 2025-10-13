import { z } from 'zod';
import { HmisGenderEnum } from '../../../../apollo';

export type TDemographicInfoFormSchema = z.infer<
  typeof DemographicInfoFormSchema
>;

export const demographicInfoFormEmptyState: TDemographicInfoFormSchema = {
  gender: [],
  additionalRaceEthnicity: '',
  differentIdentityText: '',
};

export const DemographicInfoFormSchema = z.object({
  gender: z.array(z.enum(HmisGenderEnum)).default([]),
  additionalRaceEthnicity: z.string(),
  differentIdentityText: z.string(),
});
