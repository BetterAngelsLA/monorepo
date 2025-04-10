import { ClientProfileSectionEnum } from './constants';

type TRelatedModelSectionKeys = 'HmisIds' | 'Household' | 'RelevantContacts';
type TStandardSectionKeys =
  | 'FullName'
  | 'PersonalInfo'
  | 'ImportantNotes'
  | 'Demographic'
  | 'ContactInfo';

export type TStandardSection = Pick<
  typeof ClientProfileSectionEnum,
  TStandardSectionKeys
>[keyof Pick<typeof ClientProfileSectionEnum, TStandardSectionKeys>];

export type TRelatedModelSection = Pick<
  typeof ClientProfileSectionEnum,
  TRelatedModelSectionKeys
>[keyof Pick<typeof ClientProfileSectionEnum, TRelatedModelSectionKeys>];
