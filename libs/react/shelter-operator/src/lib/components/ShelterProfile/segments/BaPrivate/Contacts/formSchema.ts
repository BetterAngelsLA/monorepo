import { Regex } from '@monorepo/react/shared';
import { z } from 'zod';

export const contactFormSchema = z.object({
  id: z.string().optional(),
  contactName: z.string().trim().min(1, 'Name is required'),
  contactNumber: z
    .string()
    .trim()
    .regex(Regex.phoneNumberLoose, 'Please enter a valid phone number'),
  contactEmail: z
    .string()
    .trim()
    .regex(Regex.email, 'Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  contactTitle: z.string(),
  isClaimant: z.boolean(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export const defaultContactValues: ContactFormData = {
  id: undefined,
  contactName: '',
  contactNumber: '',
  contactEmail: '',
  contactTitle: '',
  isClaimant: false,
};
