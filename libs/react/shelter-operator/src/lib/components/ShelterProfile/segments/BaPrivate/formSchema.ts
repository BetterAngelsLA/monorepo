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
  // Sort by the numeric id so the list renders in deterministic creation order.
  const additionalContacts = [...(shelter.additionalContacts ?? [])].sort(
    (a, b) => Number(a.id) - Number(b.id),
  );

  return {
    additionalContacts: additionalContacts.map((contact) => ({
      id: contact.id,
      contactName: contact.contactName,
      contactNumber: contact.contactNumber,
      contactEmail: contact.contactEmail ?? '',
      contactTitle: contact.contactTitle ?? '',
      isClaimant: contact.isClaimant,
    })),
  };
}
