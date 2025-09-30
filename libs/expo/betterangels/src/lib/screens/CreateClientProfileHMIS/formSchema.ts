import { z } from 'zod';
import { HmisNameQualityEnum } from '../../apollo';

export type TFormSchema = z.infer<typeof FormSchema>;

export const emptyState: TFormSchema = {
  firstName: '',
  lastName: '',
  middleName: '',
  alias: '',
  nameDataQuality: '',
};

export const FormSchema = z.object({
  firstName: z.string().min(1, 'First Name is required.'),
  lastName: z.string().min(1, 'Last Name is required.'),
  middleName: z.string(),
  alias: z.string(),
  nameDataQuality: z.enum(HmisNameQualityEnum).or(z.literal('')),
});
