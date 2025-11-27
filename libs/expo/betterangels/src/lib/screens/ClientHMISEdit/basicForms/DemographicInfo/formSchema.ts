import { z } from 'zod';
import {
  AdaAccommodationEnum,
  EyeColorEnum,
  HairColorEnum,
  HmisGenderEnum,
  HmisRaceEnum,
  MaritalStatusEnum,
  PronounEnum,
} from '../../../../apollo';

export type TDemographicInfoFormSchema = z.infer<
  typeof DemographicInfoFormSchema
>;

export const demographicInfoFormEmptyState: TDemographicInfoFormSchema = {
  gender: [],
  raceEthnicity: [],
  additionalRaceEthnicityDetail: '',
  genderIdentityText: '',
  // BA fields
  pronouns: '',
  placeOfBirth: '',
  heightInInches: undefined,
  eyeColor: '',
  hairColor: '',
  maritalStatus: '',
  physicalDescription: '',
  adaAccommodation: [],
};

export const DemographicInfoFormSchema = z
  .object({
    gender: z.array(z.enum(HmisGenderEnum)).default([]),
    raceEthnicity: z.array(z.enum(HmisRaceEnum)).default([]),
    additionalRaceEthnicityDetail: z.string(),
    genderIdentityText: z.string(),
    // BA fields
    placeOfBirth: z.string(),
    physicalDescription: z.string(),
    heightInInches: z.number().optional(),
    pronouns: z.enum(PronounEnum).or(z.literal('')),
    eyeColor: z.enum(EyeColorEnum).or(z.literal('')),
    hairColor: z.enum(HairColorEnum).or(z.literal('')),
    maritalStatus: z.enum(MaritalStatusEnum).or(z.literal('')),
    adaAccommodation: z.array(z.enum(AdaAccommodationEnum)).default([]),
  })
  .superRefine(({ gender, genderIdentityText }, ctx) => {
    const invalidGenderIdentityText =
      !genderIdentityText.trim().length &&
      gender.includes(HmisGenderEnum.Different);

    if (invalidGenderIdentityText) {
      ctx.addIssue({
        code: 'custom',
        path: ['genderIdentityText'],
        message:
          'Different identity text cannot be blank if "Different Identity" is selected.',
      });
    }
  });

export const DemographicInfoFormSchemaOut = DemographicInfoFormSchema.transform(
  ({ pronouns, eyeColor, hairColor, maritalStatus, ...rest }) => {
    return {
      ...rest,
      pronouns: pronouns === '' ? null : pronouns,
      eyeColor: eyeColor === '' ? null : eyeColor,
      hairColor: hairColor === '' ? null : hairColor,
      maritalStatus: maritalStatus === '' ? null : maritalStatus,
    };
  }
);
