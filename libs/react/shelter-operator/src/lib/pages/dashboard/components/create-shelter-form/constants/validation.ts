import {
  DemographicChoices,
  ParkingChoices,
  PetChoices,
  SpecialSituationRestrictionChoices,
  StatusChoices,
  StorageChoices,
} from '@monorepo/react/shelter';
import { z, type ZodRawShape } from 'zod';
import type { ShelterFormData } from '../../../formTypes';

const phoneRegex = /^\+?[\d\s().-]{7,20}$/;

const isValidUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/\s/.test(trimmed)) return false;

  const withScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    return Boolean(parsed.hostname) && parsed.hostname.includes('.');
  } catch {
    return false;
  }
};

type FieldSchemaMap = {
  [K in keyof ShelterFormData]?: z.ZodTypeAny;
};

const fieldSchemas: FieldSchemaMap = {
  name: z.string().min(1, 'Shelter name is required'),
  description: z.string().min(1, 'Description is required'),
  email: z
    .union([z.string().email('Enter a valid email address'), z.literal('')])
    .optional(),
  phone: z
    .string()
    .refine((value) => value === '' || phoneRegex.test(value), {
      message: 'Enter a valid phone number',
    }),
  website: z
    .string()
    .refine((value) => value === '' || isValidUrl(value), {
      message: 'Enter a valid URL',
    }),
  demographics: z
    .array(z.nativeEnum(DemographicChoices))
    .min(1, 'Select at least one demographic'),
  specialSituationRestrictions: z
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
  totalBeds: z
    .number()
    .int('Total beds must be a whole number')
    .min(0, 'Total beds must be zero or greater')
    .optional()
    .nullable(),
  maxStay: z
    .number()
    .int('Max stay must be a whole number')
    .min(0, 'Max stay must be zero or greater')
    .optional()
    .nullable(),
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
  value: ShelterFormData[K],
): string | undefined => {
  const schema = fieldSchemas[field];
  if (!schema) return undefined;

  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};
