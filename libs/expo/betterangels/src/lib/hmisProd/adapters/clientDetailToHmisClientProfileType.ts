import { HmisClientProfileType } from '@monorepo/ba-platform/types';
import { HmisProdClientDetail } from '../api';
import {
  dobQualityOrdinalToEnumNameHmisProd,
  genderOrdinalToEnumNameHmisProd,
  mapOrdinalListToEnumNamesHmisProd,
  mapOrdinalToEnumNameHmisProd,
  nameQualityOrdinalToEnumNameHmisProd,
  raceOrdinalToEnumNameHmisProd,
  suffixOrdinalToEnumNameHmisProd,
  veteranOrdinalToEnumNameHmisProd,
} from './enumOrdinalMapsHmisProd';

/**
 * Map a Clarity client detail payload to the shape the HMIS UI components
 * (`ClientProfileHeaderHmis`, profile cards) expect.
 *
 * Same cast pattern as `clientSearchItemToHmisClientProfileType`: only the
 * subset the rendered components consume is mapped. BA-only fields (CA ID,
 * living situation, pronouns, …) don't exist in Clarity and stay unset.
 * Enum ordinals are converted to the GraphQL enum names the existing display
 * maps key on.
 */
export const clientDetailToHmisClientProfileType = (
  detail: HmisProdClientDetail,
): HmisClientProfileType => {
  const sub = detail.screenValues ?? {};

  return {
    id: String(detail.id),
    hmisId: String(detail.id),
    uniqueIdentifier: detail.unique_identifier ?? null,
    firstName: detail.first_name ?? null,
    lastName: detail.last_name ?? null,
    alias: detail.alias ?? null,
    birthDate: detail.birth_date ?? null,
    nameQuality: mapOrdinalToEnumNameHmisProd(
      nameQualityOrdinalToEnumNameHmisProd,
      detail.name_quality,
    ),
    dobQuality: mapOrdinalToEnumNameHmisProd(
      dobQualityOrdinalToEnumNameHmisProd,
      detail.dob_quality,
    ),
    nameMiddle: sub.name_middle ?? detail.name_middle ?? null,
    nameSuffix: mapOrdinalToEnumNameHmisProd(
      suffixOrdinalToEnumNameHmisProd,
      sub.name_suffix ?? detail.name_suffix,
    ),
    age: sub.age ?? detail.age ?? null,
    gender: mapOrdinalListToEnumNamesHmisProd(
      genderOrdinalToEnumNameHmisProd,
      sub.gender ?? detail.gender,
    ),
    genderIdentityText:
      sub.gender_identity_text ?? detail.gender_identity_text ?? null,
    raceEthnicity: mapOrdinalListToEnumNamesHmisProd(
      raceOrdinalToEnumNameHmisProd,
      sub.race_ethnicity ?? detail.race_ethnicity,
    ),
    additionalRaceEthnicityDetail:
      sub.additional_race_ethnicity_detail ??
      detail.additional_race_ethnicity_detail ??
      null,
    veteran: mapOrdinalToEnumNameHmisProd(
      veteranOrdinalToEnumNameHmisProd,
      sub.veteran ?? detail.veteran,
    ),
  } as unknown as HmisClientProfileType;
};
