import { HmisNameQualityEnum, HmisSuffixEnum } from '../apollo';

export const enumHmisNameQuality: {
  [key in HmisNameQualityEnum]: string;
} = {
  [HmisNameQualityEnum.Full]: 'Full name reported',
  [HmisNameQualityEnum.Partial]: 'Partial, street name, or code name reported',
  [HmisNameQualityEnum.DontKnow]: "Client doesn't know",
  [HmisNameQualityEnum.NoAnswer]: 'Client prefers not to answer',
  [HmisNameQualityEnum.NotCollected]: 'Data not collected',
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
