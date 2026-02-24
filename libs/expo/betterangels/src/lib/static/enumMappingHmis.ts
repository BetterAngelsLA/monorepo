// HMIS Enum Inputs are integers, while outputs seem to be strings
// Mapping should migrate to server level

import {
  HmisDobQualityEnum,
  HmisGenderEnum,
  HmisNameQualityEnum,
  HmisRaceEnum,
  HmisSsnQualityEnum,
  HmisSuffixEnum,
  HmisVeteranStatusEnum,
} from '../apollo';

export const SsnQualityEnumIntHmis = {
  FULL: 1,
  PARTIAL: 2,
  DONT_KNOW: 8,
  NO_ANSWER: 9,
  NOT_COLLECTED: 99,
} as const;

export const NameQualityEnumIntHmis = {
  FULL: 1,
  PARTIAL: 2,
  DONT_KNOW: 8,
  NO_ANSWER: 9,
  NOT_COLLECTED: 99,
} as const;

export const DobQualityEnumIntHmis = {
  FULL: 1,
  PARTIAL: 2,
  DONT_KNOW: 8,
  NO_ANSWER: 9,
  NOT_COLLECTED: 99,
} as const;

export const SuffixIntEnumIntHmis = {
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

export const GenderEnumIntHmis = {
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

export const RaceEnumIntHmis = {
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

export const VeteranStatusEnumIntHmis = {
  NO: 0, // "No"
  YES: 1, // "Yes"
  DONT_KNOW: 8, // "Client doesn't know"
  NO_ANSWER: 9, // "Client prefers not to answer"
  NOT_COLLECTED: 99, // "Data not collected"
} as const;

export const BranchEnumIntHmis = {
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

export const DischargeEnumIntHmis = {
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
export const NameQualityIntMapHmis: Record<HmisNameQualityEnum, number> = {
  [HmisNameQualityEnum.Full]: NameQualityEnumIntHmis.FULL,
  [HmisNameQualityEnum.Partial]: NameQualityEnumIntHmis.PARTIAL,
  [HmisNameQualityEnum.DontKnow]: NameQualityEnumIntHmis.DONT_KNOW,
  [HmisNameQualityEnum.NoAnswer]: NameQualityEnumIntHmis.NO_ANSWER,
  [HmisNameQualityEnum.NotCollected]: NameQualityEnumIntHmis.NOT_COLLECTED,
};

export const SsnQualityIntMapHmis: Record<HmisNameQualityEnum, number> = {
  [HmisSsnQualityEnum.Full]: SsnQualityEnumIntHmis.FULL,
  [HmisSsnQualityEnum.Partial]: SsnQualityEnumIntHmis.PARTIAL,
  [HmisSsnQualityEnum.DontKnow]: SsnQualityEnumIntHmis.DONT_KNOW,
  [HmisSsnQualityEnum.NoAnswer]: SsnQualityEnumIntHmis.NO_ANSWER,
  [HmisSsnQualityEnum.NotCollected]: SsnQualityEnumIntHmis.NOT_COLLECTED,
};

export const DobQualityIntMapHmis: Record<HmisDobQualityEnum, number> = {
  [HmisDobQualityEnum.Full]: DobQualityEnumIntHmis.FULL,
  [HmisDobQualityEnum.Partial]: DobQualityEnumIntHmis.PARTIAL,
  [HmisDobQualityEnum.DontKnow]: DobQualityEnumIntHmis.DONT_KNOW,
  [HmisDobQualityEnum.NoAnswer]: DobQualityEnumIntHmis.NO_ANSWER,
  [HmisDobQualityEnum.NotCollected]: DobQualityEnumIntHmis.NOT_COLLECTED,
};

export const NameSuffixIntMapHmis: Record<HmisSuffixEnum, number> = {
  [HmisSuffixEnum.Jr]: SuffixIntEnumIntHmis.JR,
  [HmisSuffixEnum.Sr]: SuffixIntEnumIntHmis.SR,
  [HmisSuffixEnum.First]: SuffixIntEnumIntHmis.FIRST,
  [HmisSuffixEnum.Second]: SuffixIntEnumIntHmis.SECOND,
  [HmisSuffixEnum.Third]: SuffixIntEnumIntHmis.THIRD,
  [HmisSuffixEnum.Fourth]: SuffixIntEnumIntHmis.FOURTH,
  [HmisSuffixEnum.Fifth]: SuffixIntEnumIntHmis.FIFTH,
  [HmisSuffixEnum.Sixth]: SuffixIntEnumIntHmis.SIXTH,
  [HmisSuffixEnum.DontKnow]: SuffixIntEnumIntHmis.DONT_KNOW,
  [HmisSuffixEnum.NoAnswer]: SuffixIntEnumIntHmis.NO_ANSWER,
};

export const GenderIntMapHmis: Record<HmisGenderEnum, number> = {
  [HmisGenderEnum.Different]: GenderEnumIntHmis.DIFFERENT,
  [HmisGenderEnum.DontKnow]: GenderEnumIntHmis.DONT_KNOW,
  [HmisGenderEnum.ManBoy]: GenderEnumIntHmis.MAN_BOY,
  [HmisGenderEnum.NonBinary]: GenderEnumIntHmis.NON_BINARY,
  [HmisGenderEnum.NotCollected]: GenderEnumIntHmis.NOT_COLLECTED,
  [HmisGenderEnum.NoAnswer]: GenderEnumIntHmis.NO_ANSWER,
  [HmisGenderEnum.Questioning]: GenderEnumIntHmis.QUESTIONING,
  [HmisGenderEnum.Specific]: GenderEnumIntHmis.SPECIFIC,
  [HmisGenderEnum.Transgender]: GenderEnumIntHmis.TRANSGENDER,
  [HmisGenderEnum.WomanGirl]: GenderEnumIntHmis.WOMAN_GIRL,
};

export const RaceIntMapHmis: Record<HmisRaceEnum, number> = {
  [HmisRaceEnum.Asian]: RaceEnumIntHmis.ASIAN,
  [HmisRaceEnum.Black]: RaceEnumIntHmis.BLACK,
  [HmisRaceEnum.DontKnow]: RaceEnumIntHmis.DONT_KNOW,
  [HmisRaceEnum.Hispanic]: RaceEnumIntHmis.HISPANIC,
  [HmisRaceEnum.Indigenous]: RaceEnumIntHmis.INDIGENOUS,
  [HmisRaceEnum.MiddleEastern]: RaceEnumIntHmis.MIDDLE_EASTERN,
  [HmisRaceEnum.NotCollected]: RaceEnumIntHmis.NOT_COLLECTED,
  [HmisRaceEnum.NoAnswer]: RaceEnumIntHmis.NO_ANSWER,
  [HmisRaceEnum.PacificIslander]: RaceEnumIntHmis.PACIFIC_ISLANDER,
  [HmisRaceEnum.White]: RaceEnumIntHmis.WHITE,
};

// mapping helpers
export function toNameQualityIntHmis(
  value?: HmisNameQualityEnum | string | null
): number | null {
  return NameQualityIntMapHmis[value as HmisNameQualityEnum] ?? null;
}

export function toSsnQualityEnumIntHmis(
  value?: HmisSsnQualityEnum | string | null
): number | null {
  return SsnQualityIntMapHmis[value as HmisSsnQualityEnum] ?? null;
}

export function toSuffixEnumIntHmis(
  value?: HmisSuffixEnum | string | null
): number | null {
  return NameSuffixIntMapHmis[value as HmisSuffixEnum] ?? null;
}

export function toHmisDobQualityEnumInt(
  value?: HmisDobQualityEnum | string | null
): number | null {
  return DobQualityIntMapHmis[value as HmisDobQualityEnum] ?? null;
}

export function toDobQualityIntHmis(value?: string | null): number | null {
  return DobQualityIntMapHmis[value as HmisDobQualityEnum] ?? null;
}

export function toGenderEnumIntHmis(
  value?: HmisGenderEnum | string | null
): number | null {
  return GenderIntMapHmis[value as HmisGenderEnum] ?? null;
}

export function toRaceEnumIntHmis(
  value?: HmisRaceEnum | string | null
): number | null {
  return RaceIntMapHmis[value as HmisRaceEnum] ?? null;
}

export function toVeteranStatusEnumIntHmis(
  value?: HmisVeteranStatusEnum | string | null
): number | null {
  return VeteranStatusEnumIntHmis[value as HmisVeteranStatusEnum] ?? null;
}
