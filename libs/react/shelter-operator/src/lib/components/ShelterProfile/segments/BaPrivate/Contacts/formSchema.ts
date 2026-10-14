import { Regex } from '@monorepo/react/shared';
import { z } from 'zod';

export const contactFormSchema = z.object({
  // <id> passthrough, not validation: no form field renders this, but the resolver
  // submits zod's parsed output and zod strips undeclared keys — without it,
  // rows would submit without ids and the backend would recreate them.
  id: z.string().optional(),
  contactName: z.string().trim().min(1, 'Name is required'),
  contactNumber: z
    .string()
    .trim()
    .regex(Regex.phoneNumberLooseUS, 'Please enter a valid phone number'),
  contactEmail: z
    .string()
    .trim()
    .regex(Regex.email, 'Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  contactTitle: z.string().max(255, 'Title must be 255 characters or fewer'),
  isClaimant: z.boolean(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Contact fields whose errors ShelterContactForm can render. Typed as
// `keyof ContactFormData` so renames/removals fail the build.
export const recoverableContactFields: (keyof ContactFormData)[] = [
  'contactName',
  'contactNumber',
  'contactEmail',
  'contactTitle',
];

export const defaultContactValues: ContactFormData = {
  id: undefined,
  contactName: '',
  contactNumber: '',
  contactEmail: '',
  contactTitle: '',
  isClaimant: false,
};
