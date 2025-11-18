import { z } from 'zod';
import { HmisGenderEnum, HmisRaceEnum } from '../../../../apollo';

export type TDemographicInfoFormSchema = z.infer<
  typeof DemographicInfoFormSchema
>;

export const demographicInfoFormEmptyState: TDemographicInfoFormSchema = {
  gender: [],
  raceEthnicity: [],
  additionalRaceEthnicityDetail: '',
  genderIdentityText: '',
};

export const DemographicInfoFormSchema = z.object({
  gender: z.array(z.enum(HmisGenderEnum)).default([]),
  raceEthnicity: z.array(z.enum(HmisRaceEnum)).default([]),
  additionalRaceEthnicityDetail: z.string(),
  genderIdentityText: z.string(),
});
