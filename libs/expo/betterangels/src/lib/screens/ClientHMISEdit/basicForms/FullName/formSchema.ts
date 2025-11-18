import { z } from 'zod';
import { HmisNameQualityEnum, HmisSuffixEnum } from '../../../../apollo';

// since we require Name, NOT_COLLECTED is not a valid choice
const invalidNameDataQuality: HmisNameQualityEnum[] = [
  HmisNameQualityEnum.NotCollected,
];

export type TFullNameFormSchema = z.infer<typeof FullNameFormSchema>;

export const fullNameFormEmptyState: TFullNameFormSchema = {
  firstName: '',
  lastName: '',
  nameMiddle: '',
  alias: '',
  nameQuality: '',
  nameSuffix: '',
};

export const FullNameFormSchema = z
  .object({
    firstName: z.string().min(1, 'First Name is required.'),
    lastName: z.string().min(1, 'Last Name is required.'),
    nameMiddle: z.string(),
    alias: z.string(),
    // form uses string Enum while api requires an integer - converted onSubmit
    nameQuality: z.enum(HmisNameQualityEnum).or(z.literal('')),
    nameSuffix: z.enum(HmisSuffixEnum).or(z.literal('')),
  })
  // validate nameQuality values
  .superRefine((data, ctx) => {
    const invalidNDQ = invalidNameDataQuality.includes(
      data.nameQuality as HmisNameQualityEnum
    );

    if (invalidNDQ) {
      ctx.addIssue({
        code: 'custom',
        path: ['nameQuality'],
        message: 'Please select a valid Name Data Quality.',
      });
    }
  });
