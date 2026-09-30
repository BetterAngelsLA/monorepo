import {
  HmisDobQualityEnum,
  HmisGenderEnum,
  HmisNameQualityEnum,
  HmisRaceEnum,
  HmisSuffixEnum,
  HmisVeteranStatusEnum,
} from '@monorepo/ba-platform/types';

/**
 * Clarity returns ordinal codes for HMIS enum fields (e.g. `gender: [0, 3]`,
 * `name_suffix: 1`). These maps translate those codes back to the GraphQL
 * enum names the existing HMIS display maps key on — the same conversion the
 * BA backend performs (ordinals come from `hmis/enums.py`).
 */

export const nameQualityOrdinalToEnumNameHmisProd: Partial<
  Record<number, HmisNameQualityEnum>
> = {
  1: HmisNameQualityEnum.Full,
  2: HmisNameQualityEnum.Partial,
  8: HmisNameQualityEnum.DontKnow,
  9: HmisNameQualityEnum.NoAnswer,
  99: HmisNameQualityEnum.NotCollected,
};

export const dobQualityOrdinalToEnumNameHmisProd: Partial<
  Record<number, HmisDobQualityEnum>
> = {
  1: HmisDobQualityEnum.Full,
  2: HmisDobQualityEnum.Partial,
  8: HmisDobQualityEnum.DontKnow,
  9: HmisDobQualityEnum.NoAnswer,
  99: HmisDobQualityEnum.NotCollected,
};

export const suffixOrdinalToEnumNameHmisProd: Partial<
  Record<number, HmisSuffixEnum>
> = {
  1: HmisSuffixEnum.Jr,
  2: HmisSuffixEnum.Sr,
  3: HmisSuffixEnum.First,
  4: HmisSuffixEnum.Second,
  5: HmisSuffixEnum.Third,
  6: HmisSuffixEnum.Fourth,
  7: HmisSuffixEnum.Fifth,
  8: HmisSuffixEnum.DontKnow,
  9: HmisSuffixEnum.NoAnswer,
  10: HmisSuffixEnum.Sixth,
};

export const genderOrdinalToEnumNameHmisProd: Partial<
  Record<number, HmisGenderEnum>
> = {
  0: HmisGenderEnum.WomanGirl,
  1: HmisGenderEnum.ManBoy,
  2: HmisGenderEnum.Specific,
  3: HmisGenderEnum.Different,
  4: HmisGenderEnum.NonBinary,
  5: HmisGenderEnum.Transgender,
  6: HmisGenderEnum.Questioning,
  8: HmisGenderEnum.DontKnow,
  9: HmisGenderEnum.NoAnswer,
  99: HmisGenderEnum.NotCollected,
};

export const raceOrdinalToEnumNameHmisProd: Partial<
  Record<number, HmisRaceEnum>
> = {
  1: HmisRaceEnum.Indigenous,
  2: HmisRaceEnum.Asian,
  3: HmisRaceEnum.Black,
  4: HmisRaceEnum.PacificIslander,
  5: HmisRaceEnum.White,
  6: HmisRaceEnum.Hispanic,
  7: HmisRaceEnum.MiddleEastern,
  8: HmisRaceEnum.DontKnow,
  9: HmisRaceEnum.NoAnswer,
  99: HmisRaceEnum.NotCollected,
};

export const veteranOrdinalToEnumNameHmisProd: Partial<
  Record<number, HmisVeteranStatusEnum>
> = {
  0: HmisVeteranStatusEnum.No,
  1: HmisVeteranStatusEnum.Yes,
  8: HmisVeteranStatusEnum.DontKnow,
  9: HmisVeteranStatusEnum.NoAnswer,
  99: HmisVeteranStatusEnum.NotCollected,
};

/**
 * Translate a single ordinal (or an already-converted enum name) to the enum
 * name the HMIS display maps expect; `null` for unknown/empty values.
 */
export const mapOrdinalToEnumNameHmisProd = <T extends string>(
  ordinalMap: Partial<Record<number, T>>,
  value: unknown,
): T | null => {
  if (typeof value === 'number') {
    return ordinalMap[value] ?? null;
  }

  if (typeof value === 'string' && value.length > 0) {
    return value as T;
  }

  return null;
};

/**
 * Same as `mapOrdinalToEnumNameHmisProd` for list-valued fields
 * (e.g. `gender`, `race_ethnicity`).
 */
export const mapOrdinalListToEnumNamesHmisProd = <T extends string>(
  ordinalMap: Partial<Record<number, T>>,
  value: unknown,
): T[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  return value
    .map((item) => mapOrdinalToEnumNameHmisProd(ordinalMap, item))
    .filter((item): item is T => item !== null);
};
