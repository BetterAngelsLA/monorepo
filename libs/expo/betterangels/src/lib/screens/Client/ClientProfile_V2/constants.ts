import { ClientProfileSectionEnum } from '../../../screenRouting';

export const ClientProfileCardTitles: Record<ClientProfileSectionEnum, string> =
  {
    [ClientProfileSectionEnum.FullName]: 'Full Name',
    [ClientProfileSectionEnum.PersonalInfo]: 'Personal Info',
    [ClientProfileSectionEnum.ImportantNotes]: 'Important Notes',
    [ClientProfileSectionEnum.Demographic]: 'Demographic Info',
    [ClientProfileSectionEnum.ContactInfo]: 'Contact Info',
    [ClientProfileSectionEnum.RelevantContacts]: 'Relevant Contacts',
    [ClientProfileSectionEnum.Household]: 'Household',
    [ClientProfileSectionEnum.HmisIds]: 'HMIS IDs',
  } as const;
