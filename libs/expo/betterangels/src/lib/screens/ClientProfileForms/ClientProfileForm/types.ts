import {
  AdaAccommodationEnum,
  EyeColorEnum,
  GenderEnum,
  HairColorEnum,
  LanguageEnum,
  LivingSituationEnum,
  MaritalStatusEnum,
  PreferredCommunicationEnum,
  PronounEnum,
  RaceEnum,
  SocialMediaEnum,
  VeteranStatusEnum,
} from '../../../apollo';
import { ClientProfileSectionEnum } from '../../../screenRouting';

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
  extension?: string | null;
  isPrimary?: boolean | null;
};

export type DemographicInfoState = {
  gender?: GenderEnum | null;
  pronouns?: PronounEnum | null;
  race?: RaceEnum | null;
  placeOfBirth?: string | null;
  heightInInches?: number | null;
  eyeColor?: EyeColorEnum | null;
  hairColor?: HairColorEnum | null;
  maritalStatus?: MaritalStatusEnum | null;
  physicalDescription?: string | null;
  adaAccommodation?: AdaAccommodationEnum[] | null;
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
  [ClientProfileSectionEnum.ContactInfo]: ContactInfoState;
  [ClientProfileSectionEnum.Demographic]: DemographicInfoState;
  [ClientProfileSectionEnum.FullName]: FullnameState;
  [ClientProfileSectionEnum.ImportantNotes]: ImportantNotesState;
  [ClientProfileSectionEnum.PersonalInfo]: PersonalInfoState;
}

export interface IClientProfileForms {
  id: string;
  componentName: string;
}

export type FormValues = FormStateMapping[keyof FormStateMapping];
