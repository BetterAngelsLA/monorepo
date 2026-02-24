import {
  HmisDobQualityEnum,
  HmisGenderEnum,
  HmisNameQualityEnum,
  HmisRaceEnum,
  HmisSsnQualityEnum,
  HmisSuffixEnum,
  HmisVeteranStatusEnum,
} from '../../apollo';

export const FALLBACK_NAME_DATA_QUALITY = HmisNameQualityEnum.Partial;
export const FALLBACK_SSN_DATA_QUALITY = HmisSsnQualityEnum.NotCollected;
export const FALLBACK_DOB_DATA_QUALITY = HmisDobQualityEnum.NotCollected;
export const FALLBACK_NAME_SUFFIX = HmisSuffixEnum.NoAnswer;
export const FALLBACK_GENDER = HmisGenderEnum.NotCollected;
export const FALLBACK_RACE_ETHNICITY = HmisRaceEnum.NotCollected;
export const FALLBACK_VETERAN_STATUS = HmisVeteranStatusEnum.NotCollected;

// TBD how SSN works
export const FALLBACK_SSN_1 = 'xxx';
export const FALLBACK_SSN_2 = 'xx';
export const FALLBACK_SSN_3 = 'xxxx';
