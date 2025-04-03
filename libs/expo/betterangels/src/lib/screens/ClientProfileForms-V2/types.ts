import {
  LanguageEnum,
  LivingSituationEnum,
  PreferredCommunicationEnum,
  SocialMediaEnum,
  VeteranStatusEnum,
} from '../../apollo';
import { ClientProfileCardEnum } from '../Client/ClientProfile_V2/constants';

export type ContactInfoState = {
  id: string;
  residenceAddress?: string | null;
  mailingAddress?: string | null;
  email?: string | null;
  socialMediaProfiles?:
    | {
        id?: string | null;
        platform: SocialMediaEnum;
        platformUserId: string;
      }[]
    | null;
  preferredCommunication?: PreferredCommunicationEnum[] | null;
  phoneNumbers?: TPhoneNumber[] | null;
};

export type TPhoneNumber = {
  id?: string;
  number?: string | null;
  isPrimary?: boolean | null;
};

export type DemographicInfoState = {
  // TODO: implement actual demographic form
  name: string;
};

export type FullnameState = {
  id: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
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
  [ClientProfileCardEnum.ContactInfo]: ContactInfoState;
  [ClientProfileCardEnum.Demographic]: DemographicInfoState;
  [ClientProfileCardEnum.FullName]: FullnameState;
  [ClientProfileCardEnum.HmisIds]: HmisIdState;
  [ClientProfileCardEnum.Household]: HouseholdState;
  [ClientProfileCardEnum.ImportantNotes]: ImportantNotesState;
  [ClientProfileCardEnum.PersonalInfo]: PersonalInfoState;
  [ClientProfileCardEnum.RelevantContacts]: RelevantContactState;
}

export interface IClientProfileForms {
  id: string;
  componentName: string;
}

export type FormValues = FormStateMapping[keyof FormStateMapping];
