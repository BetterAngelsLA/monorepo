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
  nameQuality: undefined,
  nameSuffix: undefined,
};

export const FullNameFormSchema = z
  .object({
    firstName: z.string().min(1, 'First Name is required.'),
    lastName: z.string().min(1, 'Last Name is required.'),
    nameMiddle: z.string(),
    alias: z.string(),
    nameQuality: z.enum(HmisNameQualityEnum).optional(),
    nameSuffix: z.enum(HmisSuffixEnum).optional(),
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

type FullNameFormFieldName = keyof typeof FullNameFormSchema.shape;

export const FullNameFormFieldNames = Object.keys(
  FullNameFormSchema.shape
) as FullNameFormFieldName[];
