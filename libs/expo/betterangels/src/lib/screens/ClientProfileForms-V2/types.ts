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

export type ImportantNoteState = {
  // TODO: implement actual important form
  name: string;
};

export type PersonalInfoState = {
  // TODO: implement actual personal info form
  name: string;
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
  importantNote: ImportantNoteState;
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
