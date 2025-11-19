import { z } from 'zod';
import { HmisDobQualityEnum, HmisVeteranStatusEnum } from '../../../../apollo';

export type TPersonalInfoFormSchema = z.infer<typeof PersonalInfoFormSchema>;

export const personalInfoFormEmptyState: TPersonalInfoFormSchema = {
  veteran: '',
  birthDate: '',
  dobQuality: '',
};

export const PersonalInfoFormSchema = z.object({
  veteran: z.enum(HmisVeteranStatusEnum).or(z.literal('')),
  birthDate: z.string(),
  dobQuality: z.enum(HmisDobQualityEnum).or(z.literal('')),
});
