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
  description: z.string().trim().optional(),
  location: locationSchema,
  email: z.email('Invalid email address').trim().optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  website: z.url('Invalid URL').trim().optional().or(z.literal('')),
  isPrivate: z.boolean(),
});

export type BasicInfoFormData = z.infer<typeof formSchema>;

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
