import { z } from 'zod';
import { ShelterProfileType } from '../../types';
import { contactFormSchema } from './Contacts/formSchema';

export const formSchema = z.object({
  additionalContacts: z.array(contactFormSchema),
});

export type AdditionalContactsFormData = z.infer<typeof formSchema>;

export const formFieldNames = ['additionalContacts'];

export const defaultFormValues: AdditionalContactsFormData = {
  additionalContacts: [],
};

export function toFormData(
  shelter: ShelterProfileType,
): AdditionalContactsFormData {
  return {
    additionalContacts: (shelter.additionalContacts ?? []).map((contact) => ({
      id: contact.id,
      contactName: contact.contactName,
      contactNumber: contact.contactNumber,
      contactEmail: contact.contactEmail ?? '',
      contactTitle: contact.contactTitle ?? '',
      isClaimant: contact.isClaimant,
    })),
  };
}
