import { z } from 'zod';
import { HmisDobQualityEnum, HmisVeteranStatusEnum } from '../../../../apollo';

export type TPersonalInfoFormSchema = z.infer<typeof PersonalInfoFormSchema>;

export const personalInfoFormEmptyState: TPersonalInfoFormSchema = {
  veteranStatus: '',
  dob: '',
  dobDataQuality: '',
};

export const PersonalInfoFormSchema = z.object({
  veteranStatus: z.enum(HmisVeteranStatusEnum).or(z.literal('')),
  dob: z.string(),
  dobDataQuality: z.enum(HmisDobQualityEnum).or(z.literal('')),
});
