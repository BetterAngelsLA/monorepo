import { z } from 'zod';
import { ShelterProfileType } from '../../types';
// Import the leaf schema module directly, not the `./Contacts` barrel: the
// barrel re-exports `ShelterContacts`, which imports this file back. Deep
// import keeps this module cycle-free and avoids dragging the contacts React
// tree into every consumer of the schema.
import {
  contactFormSchema,
  recoverableContactFields,
} from './Contacts/formSchema';

export const formSchema = z.object({
  additionalContacts: z.array(contactFormSchema),
});

export type AdditionalContactsFormData = z.infer<typeof formSchema>;

// Field-array items: each `additionalContacts` row is a sub-form for the
// contact schema's fields. The children list lives with the contact schema
// (see `recoverableContactFields`); messages on other paths (e.g. a stale
// `.id`) are unrecoverable and fail with the generic error.
export const formFieldNames = [
  {
    parentKey: 'additionalContacts',
    children: recoverableContactFields,
  },
];

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
