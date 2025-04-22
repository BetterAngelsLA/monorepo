import { validateAsEnum } from '../../helpers/validateAsEnum';

export enum ClientProfileSectionEnum {
  FullName = 'FullName',
  PersonalInfo = 'PersonalInfo',
  ImportantNotes = 'ImportantNotes',
  Demographic = 'Demographic',
  ContactInfo = 'ContactInfo',
  RelevantContacts = 'RelevantContacts',
  Household = 'Household',
  HmisIds = 'HmisIds',
}

export function isValidClientProfileSectionEnum(
  value: any
): value is ClientProfileSectionEnum {
  return validateAsEnum(value, ClientProfileSectionEnum);
}
