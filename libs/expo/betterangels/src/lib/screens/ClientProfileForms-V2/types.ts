import {
  LanguageEnum,
  LivingSituationEnum,
  VeteranStatusEnum,
} from '../../apollo';

export type ContactInfoState = {
  // TODO: implement actual contact form
  name: string;
};

export type DemographicInfoState = {
  // TODO: implement actual demographic form
  name: string;
};

export type FullnameState = {
  id: string;
  user: {
    id: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
  };
  nickname?: string;
};

export type HmisIdState = {
  // TODO: implement actual HMIS id form
  name: string;
};

export type HouseholdState = {
  // TODO: implement actual Household form
  name: string;
};

export type ImportantNotesState = {
  importantNotes?: string | null;
};

type TProfilePhoto = {
  name: string;
  url: string;
};

export type PersonalInfoState = {
  id: string;
  dateOfBirth?: Date | null;
  californiaId?: string | null;
  preferredLanguage?: LanguageEnum | null;
  veteranStatus?: VeteranStatusEnum | null;
  livingSituation?: LivingSituationEnum | null;
  profilePhoto?: TProfilePhoto | null;
};

export type RelevantContactState = {
  // TODO: implement actual relevant contact info form
  name: string;
};

export interface FormStateMapping {
  contactInfo: ContactInfoState;
  demographicInfo: DemographicInfoState;
  fullname: FullnameState;
  hmisId: HmisIdState;
  household: HouseholdState;
  importantNotes: ImportantNotesState;
  personalInfo: PersonalInfoState;
  relevantContact: RelevantContactState;
}

export interface IClientProfileForms {
  id: string;
  componentName: string;
}

export type TValidationError = {
  field: string;
  location: string | undefined;
  errorCode: string;
};

export type FormValues = FormStateMapping[keyof FormStateMapping];
