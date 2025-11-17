import { z, type ZodRawShape } from 'zod';
import {
  DemographicChoices,
  EntryRequirementChoices,
  ExitPolicyChoices,
  ReferralRequirementChoices,
  RoomStyleChoices,
  ShelterChoices,
  StatusChoices,
} from '@monorepo/react/shelter';
import type { ShelterFormData } from '../../../types';

const phoneRegex = /^\+?[\d\s().-]{7,20}$/;
const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

type FieldSchemaMap = {
  [K in keyof ShelterFormData]?: z.ZodType<ShelterFormData[K]>;
};

const fieldSchemas: FieldSchemaMap = {
  name: z.string().min(1, 'Shelter name is required'),
  organization: z.string().min(1, 'Organization is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(1, 'Description is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
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
  shelter_types: z
    .array(z.nativeEnum(ShelterChoices))
    .min(1, 'Select at least one shelter type'),
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
  room_styles: z
    .array(z.nativeEnum(RoomStyleChoices))
    .min(1, 'Select at least one room style'),
  intake_hours: z.string().min(1, 'Intake hours are required'),
  curfew: z.string().min(1, 'Curfew is required'),
  exit_policy: z
    .array(z.nativeEnum(ExitPolicyChoices))
    .min(1, 'Select at least one exit policy'),
  entry_requirements: z
    .array(z.nativeEnum(EntryRequirementChoices))
    .min(1, 'Select at least one entry requirement'),
  referral_requirement: z
    .array(z.nativeEnum(ReferralRequirementChoices))
    .min(1, 'Select at least one referral requirement'),
  status: z.nativeEnum(StatusChoices, {
    required_error: 'Status is required',
  }),
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
