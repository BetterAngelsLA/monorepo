import {
  HmisDobQualityEnum,
  HmisGenderEnum,
  HmisNameQualityEnum,
  HmisRaceEnum,
  HmisSuffixEnum,
  HmisVeteranStatusEnum,
} from '../apollo';

export const enumHmisNameQuality: {
  [key in HmisNameQualityEnum]: string;
} = {
  [HmisNameQualityEnum.Full]: 'Full name reported',
  [HmisNameQualityEnum.Partial]: 'Partial, street name, or code name reported',
  [HmisNameQualityEnum.DontKnow]: "Client doesn't know",
  [HmisNameQualityEnum.NoAnswer]: 'Client prefers not to answer',
  [HmisNameQualityEnum.NotCollected]: 'Data not collected',
};

export const enumHmisDobQuality: {
  [key in HmisDobQualityEnum]: string;
} = {
  [HmisDobQualityEnum.Full]: 'Full DOB reported',
  [HmisDobQualityEnum.Partial]: 'Approximate or partial DOB reported',
  [HmisDobQualityEnum.DontKnow]: "Client doesn't know",
  [HmisDobQualityEnum.NoAnswer]: 'Client prefers not to answer',
  [HmisDobQualityEnum.NotCollected]: 'Data not collected',
};

export const enumHmisGender: {
  [key in HmisGenderEnum]: string;
} = {
  [HmisGenderEnum.WomanGirl]: 'Woman (Girl, if child)',
  [HmisGenderEnum.ManBoy]: 'Man (Boy, if child)',
  [HmisGenderEnum.Specific]: 'Culturally Specific Identity (e.g., Two-Spirit)',
  [HmisGenderEnum.Transgender]: 'Transgender',
  [HmisGenderEnum.NonBinary]: 'Non-Binary',
  [HmisGenderEnum.Questioning]: 'Questioning',
  [HmisGenderEnum.Different]: 'Different Identity',
  [HmisGenderEnum.DontKnow]: "Client doesn't know",
  [HmisGenderEnum.NoAnswer]: 'Client prefers not to answer',
  [HmisGenderEnum.NotCollected]: 'Data not collected',
};

export const enumHmisRace: {
  [key in HmisRaceEnum]: string;
} = {
  [HmisRaceEnum.Indigenous]: 'American Indian, Alaska Native, or Indigenous',
  [HmisRaceEnum.Asian]: 'Asian or Asian American',
  [HmisRaceEnum.Black]: 'Black, African American, or African',
  [HmisRaceEnum.Hispanic]: 'Hispanic/Latina/o',
  [HmisRaceEnum.MiddleEastern]: 'Middle Eastern or North African',
  [HmisRaceEnum.PacificIslander]: 'Native Hawaiian or Pacific Islander',
  [HmisRaceEnum.White]: 'White',
  [HmisRaceEnum.DontKnow]: 'Client doesn’t know',
  [HmisRaceEnum.NoAnswer]: 'Client prefers not to answer',
  [HmisRaceEnum.NotCollected]: 'Data not collected',
};

export const enumHmisVeteranStatusEnum: {
  [key in HmisVeteranStatusEnum]: string;
} = {
  [HmisVeteranStatusEnum.No]: 'No',
  [HmisVeteranStatusEnum.Yes]: 'Yes',
  [HmisVeteranStatusEnum.DontKnow]: "Client doesn't know",
  [HmisVeteranStatusEnum.NoAnswer]: 'Client prefers not to answer',
  [HmisVeteranStatusEnum.NotCollected]: 'Data not collected',
};

export const enumDisplayHmisSuffix: {
  [key in HmisSuffixEnum]: string;
} = {
  [HmisSuffixEnum.Jr]: 'Jr.',
  [HmisSuffixEnum.Sr]: 'Sr.',
  [HmisSuffixEnum.First]: 'I',
  [HmisSuffixEnum.Second]: 'II',
  [HmisSuffixEnum.Third]: 'III',
  [HmisSuffixEnum.Fourth]: 'IV',
  [HmisSuffixEnum.Fifth]: 'V',
  [HmisSuffixEnum.Sixth]: 'VI',
  [HmisSuffixEnum.DontKnow]: "Client doesn't know",
  [HmisSuffixEnum.NoAnswer]: 'Client prefers not to answer',
};

const excludedSuffixes = [HmisSuffixEnum.DontKnow, HmisSuffixEnum.NoAnswer];

export function getExistingHmisSuffix(value?: HmisSuffixEnum): string {
  if (!value || excludedSuffixes.includes(value)) {
    return '';
  }

  return enumDisplayHmisSuffix[value] || '';
}
