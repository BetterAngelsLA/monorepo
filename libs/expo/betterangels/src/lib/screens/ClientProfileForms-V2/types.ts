type ContactInfoState = {
  // TODO: implement actual contact form
  name: string;
};

type DemographicInfoState = {
  // TODO: implement actual demographic form
  name: string;
};

type FullnameState = {
  // TODO: implement actual fullname form
  name: string;
};

type HmisIdState = {
  // TODO: implement actual HMIS id form
  name: string;
};

type HouseholdState = {
  // TODO: implement actual Household form
  name: string;
};

type ImportantNoteState = {
  // TODO: implement actual important form
  name: string;
};

type PersonalInfoState = {
  // TODO: implement actual personal info form
  name: string;
};

type RelevantContactState = {
  // TODO: implement actual relevant contact info form
  name: string;
};

export interface FormStateMapping {
  // sample
  ContactInfo: ContactInfoState;
  DemographicInfo: DemographicInfoState;
  Fullname: FullnameState;
  HmisId: HmisIdState;
  Household: HouseholdState;
  ImportantNote: ImportantNoteState;
  PersonalInfo: PersonalInfoState;
  RelevantContact: RelevantContactState;
}

export interface IClientProfileForms<K extends keyof FormStateMapping> {
  id: string;
  componentName: K;
}
