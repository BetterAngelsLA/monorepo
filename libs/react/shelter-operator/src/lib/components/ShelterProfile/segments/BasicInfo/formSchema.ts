import { Regex } from '@monorepo/react/shared';
import { StatusChoices } from '@monorepo/react/shelter';
import { z } from 'zod';
import { ShelterProfileType } from '../../types';

const locationSchema = z
  .object({
    place: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .nullable()
  .optional();

export const formSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  status: z.enum(StatusChoices).refine(Boolean, 'Status is required'),
  description: z.string(),
  location: locationSchema,
  email: z
    .string()
    .trim()
    .regex(Regex.email, 'Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .regex(Regex.phoneNumberLoose, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .trim()
    .regex(Regex.url, 'Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  isPrivate: z.boolean(),
});

export type BasicInfoFormData = z.infer<typeof formSchema>;

export const formFieldNames = Object.keys(formSchema.shape);

export const defaultFormValues: BasicInfoFormData = {
  name: '',
  status: StatusChoices.Draft,
  description: '',
  location: null,
  email: '',
  phone: '',
  website: '',
  isPrivate: false,
};

export function toFormData(shelter: ShelterProfileType): BasicInfoFormData {
  return {
    name: shelter.name,
    status: shelter.status,
    description: shelter.description,
    location: shelter.location
      ? {
          place: shelter.location.place,
          latitude: shelter.location.latitude,
          longitude: shelter.location.longitude,
        }
      : null,
    email: shelter.email ?? '',
    phone: shelter.phone ?? '',
    website: shelter.website ?? '',
    isPrivate: shelter.isPrivate,
  };
}
