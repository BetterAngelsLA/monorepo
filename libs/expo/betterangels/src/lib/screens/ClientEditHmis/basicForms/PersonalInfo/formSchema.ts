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
  birthDate: null,
  dobQuality: '',
  californiaId: '',
  livingSituation: '',
  preferredLanguage: '',
  unhousedStartDate: null,
};

export const PersonalInfoFormSchema = z.object({
  birthDate: z.coerce
    .date()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true;
        return !Number.isNaN(date.getTime());
      },
      {
        message: 'Date is invalid.',
      }
    ),
  dobQuality: z.enum(HmisDobQualityEnum).or(z.literal('')),
  unhousedStartDate: z.coerce
    .date()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true;
        return !Number.isNaN(date.getTime());
      },
      {
        message: 'Date is invalid.',
      }
    ),
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
    unhousedStartDate,
    preferredLanguage,
    livingSituation,
    dobQuality,
    veteran,
    ...rest
  }) => {
    const formattedDob =
      birthDate instanceof Date && !Number.isNaN(birthDate.getTime())
        ? format(birthDate, 'yyyy-MM-dd')
        : null;

    const formattedUnhousedStartDate =
      unhousedStartDate instanceof Date &&
      !Number.isNaN(unhousedStartDate.getTime())
        ? format(unhousedStartDate, 'yyyy-MM-dd')
        : null;

    return {
      ...rest,
      birthDate: formattedDob,
      unhousedStartDate: formattedUnhousedStartDate,
      preferredLanguage: preferredLanguage === '' ? null : preferredLanguage,
      livingSituation: livingSituation === '' ? null : livingSituation,
      dobQuality: dobQuality === '' ? null : dobQuality,
      veteran: veteran === '' ? null : veteran,
    };
  }
);
