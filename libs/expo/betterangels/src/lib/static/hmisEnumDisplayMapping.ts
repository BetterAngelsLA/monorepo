import {
  HmisDobQualityEnum,
  HmisNameQualityEnum,
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
