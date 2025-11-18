import { z, type ZodRawShape } from 'zod';
import {
  DemographicChoices,
  ParkingChoices,
  PetChoices,
  SpecialSituationRestrictionChoices,
  StatusChoices,
  StorageChoices,
} from '@monorepo/react/shelter';
import type { ShelterFormData } from '../../../types';

const phoneRegex = /^\+?[\d\s().-]{7,20}$/;
const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

type FieldSchemaMap = {
  [K in keyof ShelterFormData]?: z.ZodTypeAny;
};

const fieldSchemas: FieldSchemaMap = {
  name: z.string().min(1, 'Shelter name is required'),
  organization: z.string().optional(),
  location: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  email: z.union([z.string().email('Enter a valid email address'), z.literal('')]).optional(),
  phone: z
    .string()
    .refine(value => value === '' || phoneRegex.test(value), {
      message: 'Enter a valid phone number',
    }),
  website: z
    .string()
    .refine(value => value === '' || urlRegex.test(value), {
      message: 'Enter a valid URL',
    }),
  demographics: z
    .array(z.nativeEnum(DemographicChoices))
    .min(1, 'Select at least one demographic'),
  special_situation_restrictions: z
    .array(z.nativeEnum(SpecialSituationRestrictionChoices))
    .min(1, 'Select at least one special situation'),
  storage: z
    .array(z.nativeEnum(StorageChoices))
    .min(1, 'Select at least one storage option'),
  pets: z
    .array(z.nativeEnum(PetChoices))
    .min(1, 'Select at least one pet option'),
  parking: z
    .array(z.nativeEnum(ParkingChoices))
    .min(1, 'Select at least one parking option'),
  total_beds: z
    .number()
    .int('Total beds must be a whole number')
    .min(0, 'Total beds must be zero or greater')
    .optional()
    .nullable(),
  max_stay: z
    .number()
    .int('Max stay must be a whole number')
    .min(0, 'Max stay must be zero or greater')
    .optional()
    .nullable(),
  room_styles: z.array(z.string()),
  shelter_types: z.array(z.string()),
  intake_hours: z.string().optional(),
  curfew: z.string().optional(),
  exit_policy: z.array(z.string()),
  entry_requirements: z.array(z.string()).optional(),
  referral_requirement: z.array(z.string()).optional(),
  status: z.nativeEnum(StatusChoices).refine(Boolean, 'Status is required'),
};

const formSchema = z.object(fieldSchemas as ZodRawShape).passthrough();

export type FormErrors = Partial<Record<keyof ShelterFormData, string>>;

const mapIssuesToErrors = (issues: z.ZodIssue[]): FormErrors => {
  return issues.reduce<FormErrors>((acc, issue) => {
    const [pathKey] = issue.path;
    if (typeof pathKey === 'string') {
      acc[pathKey as keyof ShelterFormData] ??= issue.message;
    }
    return acc;
  }, {});
};

export const validateShelterForm = (data: ShelterFormData) => {
  const result = formSchema.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: {} as FormErrors };
  }
  return {
    isValid: false,
    errors: mapIssuesToErrors(result.error.issues),
  };
};

export const validateField = <K extends keyof ShelterFormData>(
  field: K,
  value: ShelterFormData[K]
): string | undefined => {
  const schema = fieldSchemas[field];
  if (!schema) {
    return undefined;
  }

  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};
