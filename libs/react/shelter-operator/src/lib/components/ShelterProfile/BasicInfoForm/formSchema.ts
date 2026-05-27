import { z } from 'zod';

const locationSchema = z
  .object({
    place: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .nullable()
  .optional();

export const basicInfoFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  location: locationSchema,
  email: z.email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  website: z.url('Invalid URL').optional().or(z.literal('')),
  isPrivate: z.boolean(),
});

export type BasicInfoFormData = z.infer<typeof basicInfoFormSchema>;

export const basicInfoDefaultValues: BasicInfoFormData = {
  name: '',
  description: '',
  location: null,
  email: '',
  phone: '',
  website: '',
  isPrivate: false,
};
