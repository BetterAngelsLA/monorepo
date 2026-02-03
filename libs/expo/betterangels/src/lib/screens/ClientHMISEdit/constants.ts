import {
  HmisDobQualityEnum,
  HmisGenderEnum,
  HmisNameQualityEnum,
  HmisRaceEnum,
  HmisSsnQualityEnum,
  HmisSuffixEnum,
  HmisVeteranStatusEnum,
} from '../../apollo';
import {
  HmisDobQualityEnumInt,
  HmisGenderEnumInt,
  HmisNameQualityEnumInt,
  HmisRaceEnumInt,
  HmisSsnQualityEnumInt,
  HmisSuffixIntEnumInt,
  HmisVeteranStatusEnumInt,
} from '../../static';

export const FALLBACK_NAME_DATA_QUALITY = HmisNameQualityEnum.NotCollected;
export const FALLBACK_NAME_DATA_QUALITY_INT =
  HmisNameQualityEnumInt.NOT_COLLECTED;

export const FALLBACK_SSN_DATA_QUALITY = HmisSsnQualityEnum.NotCollected;
export const FALLBACK_SSN_DATA_QUALITY_INT =
  HmisSsnQualityEnumInt.NOT_COLLECTED;

export const FALLBACK_DOB_DATA_QUALITY = HmisDobQualityEnum.NotCollected;
export const FALLBACK_DOB_DATA_QUALITY_INT =
  HmisDobQualityEnumInt.NOT_COLLECTED;

export const FALLBACK_NAME_SUFFIX = HmisSuffixEnum.NoAnswer;
export const FALLBACK_NAME_SUFFIX_INT = HmisSuffixIntEnumInt.NO_ANSWER;

export const FALLBACK_GENDER = HmisGenderEnum.NotCollected;
export const FALLBACK_GENDER_INT = HmisGenderEnumInt.NOT_COLLECTED;

export const FALLBACK_RACE_ETHNICITY = HmisRaceEnum.NotCollected;
export const FALLBACK_RACE_ETHNICITY_INT = HmisRaceEnumInt.NOT_COLLECTED;

export const FALLBACK_VETERAN_STATUS = HmisVeteranStatusEnum.NotCollected;
export const FALLBACK_VETERAN_STATUS_INT =
  HmisVeteranStatusEnumInt.NOT_COLLECTED;

// TBD how SSN works
export const FALLBACK_SSN_1 = 'xxx';
export const FALLBACK_SSN_2 = 'xx';
export const FALLBACK_SSN_3 = 'xxxx';
