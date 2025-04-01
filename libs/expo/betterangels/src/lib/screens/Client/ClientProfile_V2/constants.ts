export enum ClientProfileCardEnum {
  FullName = 'FULL_NAME',
  PersonalInfo = 'PERSONAL_INFO',
  ImportantNotes = 'IMPORTANT_NOTES',
  Demographic = 'DEMOGRAPHIC',
  ContactInfo = 'CONTACT_INFO',
  RelevantContacts = 'RELEVANT_CONTACTS',
  Household = 'HOUSEHOLD',
  HmisIds = 'HMIS_IDS',
}

export function isValidClientProfileCardEnum(
  value: any
): value is ClientProfileCardEnum {
  return Object.values(ClientProfileCardEnum).includes(value);
}

export const ClientProfileCardTitles: Record<ClientProfileCardEnum, string> = {
  [ClientProfileCardEnum.FullName]: 'Full Name',
  [ClientProfileCardEnum.PersonalInfo]: 'Personal Info',
  [ClientProfileCardEnum.ImportantNotes]: 'Important Notes',
  [ClientProfileCardEnum.Demographic]: 'Demographic Info',
  [ClientProfileCardEnum.ContactInfo]: 'Contact Info',
  [ClientProfileCardEnum.RelevantContacts]: 'Relevant Contacts',
  [ClientProfileCardEnum.Household]: 'Household',
  [ClientProfileCardEnum.HmisIds]: 'HMIS IDs',
} as const;
