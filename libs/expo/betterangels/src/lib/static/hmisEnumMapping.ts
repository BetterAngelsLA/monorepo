// HMIS Enum Inputs are integers, while outputs seem to be strings
// Mapping should migrate to server level

import {
  HmisDobQualityEnum,
  HmisNameQualityEnum,
  HmisSsnQualityEnum,
  HmisSuffixEnum,
} from '../apollo';

export const HmisSsnQualityEnumInt = {
  FULL: 1,
  PARTIAL: 2,
  DONT_KNOW: 8,
  NO_ANSWER: 9,
  NOT_COLLECTED: 99,
} as const;

export const HmisNameQualityEnumInt = {
  FULL: 1,
  PARTIAL: 2,
  DONT_KNOW: 8,
  NO_ANSWER: 9,
  NOT_COLLECTED: 99,
} as const;

export const HmisDobQualityEnumInt = {
  FULL: 1,
  PARTIAL: 2,
  DONT_KNOW: 8,
  NO_ANSWER: 9,
  NOT_COLLECTED: 99,
} as const;

export const HmisSuffixIntEnumInt = {
  JR: 1, //  "Jr."
  SR: 2, // "Sr."
  FIRST: 3, // "I"
  SECOND: 4, // "II"
  THIRD: 5, // "III"
  FOURTH: 6, // "IV"
  FIFTH: 7, // "V"
  SIXTH: 10, // "VI"
  DONT_KNOW: 8, // "Client doesn't know"
  NO_ANSWER: 9, // "Client prefers not to answer"
} as const;

export const HmisGenderEnumInt = {
  WOMAN_GIRL: 0, // "Woman (Girl, if child)"
  MAN_BOY: 1, // "Man (Boy, if child)"
  SPECIFIC: 2, // "Culturally Specific Identity (e.g., Two-Spirit)"
  TRANSGENDER: 5, // "Transgender"
  NON_BINARY: 4, // "Non-Binary"
  QUESTIONING: 6, // "Questioning"
  DIFFERENT: 3, // "Different Identity"
  DONT_KNOW: 8, // "Client doesn't know"
  NO_ANSWER: 9, // "Client prefers not to answer"
  NOT_COLLECTED: 99, // "Data not collected"
} as const;

export const HmisRaceEnumInt = {
  INDIGENOUS: 1, // "American Indian, Alaska Native, or Indigenous"
  ASIAN: 2, // "Asian or Asian American"
  BLACK: 3, // "Black, African American, or African"
  HISPANIC: 6, // "Hispanic/Latina/o"
  MIDDLE_EASTERN: 7, // "Middle Eastern or North African"
  PACIFIC_ISLANDER: 4, // "Native Hawaiian or Pacific Islander"
  WHITE: 5, // "White"
  DONT_KNOW: 8, // "Client doesn’t know"
  NO_ANSWER: 9, // "Client prefers not to answer"
  NOT_COLLECTED: 99, // "Data not collected"
} as const;

export const HmisVeteranStatusEnumInt = {
  NO: 0, // "No"
  YES: 1, // "Yes"
  DONT_KNOW: 8, // "Client doesn't know"
  NO_ANSWER: 9, // "Client prefers not to answer"
  NOT_COLLECTED: 99, // "Data not collected"
} as const;

export const HmisVeteranTheaterEnumInt = {
  NO: 0, // "No"
  YES: 1, // "Yes"
  DONT_KNOW: 8, // "Client doesn't know"
  NO_ANSWER: 9, // "Client prefers not to answer"
  NOT_COLLECTED: 99, // "Data not collected"
};

export const HmisBranchEnumInt = {
  ARMY: 1, // "Army"
  AIR_FORCE: 2, // "Air Force"
  NAVY: 3, // "Navy"
  MARINES: 4, // "Marines"
  COAST_GUARD: 6, // "Coast Guard"
  SPACE_FORCE: 7, // "Space Force"
  DONT_KNOW: 8, // "Client doesn't know"
  NO_ANSWER: 9, // "Client prefers not to answer"
  NOT_COLLECTED: 99, // "Data not collected"
};

export const HmisDischargeEnumInt = {
  HONORABLE: 1, // "Honorable"
  GENERAL_HONORABLE: 2, // "General under honorable conditions"
  OTHER_THAN_HONORABLE: 6, // "Under other than honorable conditions (OTH"
  BAD_CONDUCT: 4, // "Bad Conduct"
  DISHONORABLE: 5, // "Dishonorable"
  UNCHARACTERIZED: 7, // "Uncharacterized"
  DONT_KNOW: 8, // "Client doesn't know"
  NO_ANSWER: 9, // "Client prefers not to answer"
  NOT_COLLECTED: 99, // "Data not collected"
};

// Int maps
export const HmisNameQualityIntMap: Record<HmisNameQualityEnum, number> = {
  [HmisNameQualityEnum.Full]: HmisNameQualityEnumInt.FULL,
  [HmisNameQualityEnum.Partial]: HmisNameQualityEnumInt.PARTIAL,
  [HmisNameQualityEnum.DontKnow]: HmisNameQualityEnumInt.DONT_KNOW,
  [HmisNameQualityEnum.NoAnswer]: HmisNameQualityEnumInt.NO_ANSWER,
  [HmisNameQualityEnum.NotCollected]: HmisNameQualityEnumInt.NOT_COLLECTED,
};

export const HmisSsnQualityIntMap: Record<HmisNameQualityEnum, number> = {
  [HmisSsnQualityEnum.Full]: HmisSsnQualityEnumInt.FULL,
  [HmisSsnQualityEnum.Partial]: HmisSsnQualityEnumInt.PARTIAL,
  [HmisSsnQualityEnum.DontKnow]: HmisSsnQualityEnumInt.DONT_KNOW,
  [HmisSsnQualityEnum.NoAnswer]: HmisSsnQualityEnumInt.NO_ANSWER,
  [HmisSsnQualityEnum.NotCollected]: HmisSsnQualityEnumInt.NOT_COLLECTED,
};

export const HmisDobQualityIntMap: Record<HmisDobQualityEnum, number> = {
  [HmisDobQualityEnum.Full]: HmisSsnQualityEnumInt.FULL,
  [HmisDobQualityEnum.Partial]: HmisSsnQualityEnumInt.PARTIAL,
  [HmisDobQualityEnum.DontKnow]: HmisSsnQualityEnumInt.DONT_KNOW,
  [HmisDobQualityEnum.NoAnswer]: HmisSsnQualityEnumInt.NO_ANSWER,
  [HmisDobQualityEnum.NotCollected]: HmisSsnQualityEnumInt.NOT_COLLECTED,
};

export const HmisNameSuffixIntMap: Record<HmisSuffixEnum, number> = {
  [HmisSuffixEnum.Jr]: HmisSuffixIntEnumInt.JR,
  [HmisSuffixEnum.Sr]: HmisSuffixIntEnumInt.SR,
  [HmisSuffixEnum.First]: HmisSuffixIntEnumInt.FIRST,
  [HmisSuffixEnum.Second]: HmisSuffixIntEnumInt.SECOND,
  [HmisSuffixEnum.Third]: HmisSuffixIntEnumInt.THIRD,
  [HmisSuffixEnum.Fourth]: HmisSuffixIntEnumInt.FOURTH,
  [HmisSuffixEnum.Fifth]: HmisSuffixIntEnumInt.FIFTH,
  [HmisSuffixEnum.Sixth]: HmisSuffixIntEnumInt.SIXTH,
  [HmisSuffixEnum.DontKnow]: HmisSuffixIntEnumInt.DONT_KNOW,
  [HmisSuffixEnum.NoAnswer]: HmisSuffixIntEnumInt.NO_ANSWER,
};

// mapping helpers
export function toHmisNameQualityInt(
  value?: HmisNameQualityEnum | string | null
): number | null {
  return HmisNameQualityIntMap[value as HmisNameQualityEnum] ?? null;
}

export function toHmisSsnQualityEnumInt(
  value?: HmisSsnQualityEnum | string | null
): number | null {
  return HmisSsnQualityIntMap[value as HmisSsnQualityEnum] ?? null;
}

export function toHmisSuffixEnumInt(
  value?: HmisSuffixEnum | string | null
): number | null {
  return HmisNameSuffixIntMap[value as HmisSuffixEnum] ?? null;
}

export function toHmisDobQualityEnumInt(
  value?: HmisDobQualityEnum | string | null
): number | null {
  return HmisDobQualityIntMap[value as HmisDobQualityEnum] ?? null;
}
