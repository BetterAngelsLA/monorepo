import { Regex } from '@monorepo/react/shared';
import { format } from 'date-fns';
import { z } from 'zod';
import {
  HmisDobQualityEnum,
  HmisVeteranStatusEnum,
  LanguageEnum,
  LivingSituationEnum,
} from '../../../../apollo';

export type TPersonalInfoFormSchema = z.input<typeof PersonalInfoFormSchema>;

export const personalInfoFormEmptyState: TPersonalInfoFormSchema = {
  veteran: '',
  birthDate: '',
  dobQuality: '',
  californiaId: '',
  livingSituation: '',
  preferredLanguage: '',
};

export const PersonalInfoFormSchema = z.object({
  birthDate: z
    .preprocess(
      (arg) => {
        if (arg === '' || arg === null) {
          return undefined;
        }
        return arg;
      },
      z.coerce.date().refine((date) => !Number.isNaN(date.getTime()), {
        message: 'Date is invalid.',
      })
    )
    .optional(),

  dobQuality: z.enum(HmisDobQualityEnum).or(z.literal('')),
  veteran: z.enum(HmisVeteranStatusEnum).or(z.literal('')),
  livingSituation: z.enum(LivingSituationEnum).or(z.literal('')),
  preferredLanguage: z.enum(LanguageEnum).or(z.literal('')),
  californiaId: z
    .string()
    .regex(Regex.californiaId, {
      message: 'California ID must be 1 letter followed by 7 digits',
    })
    .or(z.literal('')),
});

export const PersonalInfoFormSchemaOut = PersonalInfoFormSchema.transform(
  ({
    birthDate,
    preferredLanguage,
    livingSituation,
    dobQuality,
    veteran,
    ...rest
  }) => {
    let formattedDate: string | null = null;

    if (birthDate instanceof Date && !Number.isNaN(birthDate.getTime())) {
      formattedDate = format(birthDate, 'yyyy-MM-dd');
    }

    const finalDobQuality = formattedDate ? dobQuality : null;

    return {
      ...rest,
      birthDate: formattedDate,
      dobQuality: finalDobQuality === '' ? null : finalDobQuality,
      preferredLanguage: preferredLanguage === '' ? null : preferredLanguage,
      livingSituation: livingSituation === '' ? null : livingSituation,
      veteran: veteran === '' ? null : veteran,
    };
  }
);
