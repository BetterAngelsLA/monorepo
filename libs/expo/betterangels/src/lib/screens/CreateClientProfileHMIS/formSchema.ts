import { z } from 'zod';
import { HmisNameQualityEnum } from '../../apollo';

export type TFormSchema = z.infer<typeof FormSchema>;

export const emptyState: TFormSchema = {
  firstName: '',
  lastName: '',
  middleName: '',
  aliases: '',
  nameDataQuality: '',
};

export const FormSchema = z.object({
  firstName: z.string().min(1, 'First Name is required.'),
  lastName: z.string().min(1, 'Last Name is required.'),
  middleName: z.string(),
  aliases: z.string(),
  nameDataQuality: z.enum(HmisNameQualityEnum).or(z.literal('')),
});
