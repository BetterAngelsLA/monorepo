export enum ClientProfileSectionsEnum {
  FullName = 'FULL_NAME',
  PersonalInfo = 'PERSONAL_INFO',
  ImportantNotes = 'IMPORTANT_NOTES',
  Demographic = 'DEMOGRAPHIC',
  ContactInfo = 'CONTACT_INFO',
  RelevantContacts = 'RELEVANT_CONTACTS',
  Household = 'HOUSEHOLD',
  HmisIds = 'HMIS_IDS',
}

export const ClientSectionTitles: Record<ClientProfileSectionsEnum, string> = {
  [ClientProfileSectionsEnum.FullName]: 'Full Name',
  [ClientProfileSectionsEnum.PersonalInfo]: 'Personal Info',
  [ClientProfileSectionsEnum.ImportantNotes]: 'Important Notes',
  [ClientProfileSectionsEnum.Demographic]: 'Demographic',
  [ClientProfileSectionsEnum.ContactInfo]: 'Contact Info',
  [ClientProfileSectionsEnum.RelevantContacts]: 'Relevant Contacts',
  [ClientProfileSectionsEnum.Household]: 'Household',
  [ClientProfileSectionsEnum.HmisIds]: 'HMIS IDs',
} as const;
