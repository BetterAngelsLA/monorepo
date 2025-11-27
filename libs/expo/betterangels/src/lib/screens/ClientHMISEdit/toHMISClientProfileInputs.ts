import {
  HmisClientProfileType,
  UpdateHmisClientProfileInput,
} from '../../apollo';
import {
  FALLBACK_GENDER,
  FALLBACK_NAME_SUFFIX,
  FALLBACK_RACE_ETHNICITY,
  FALLBACK_VETERAN_STATUS,
} from './constants';

function firstNonEmptyArray<T>(
  ...candidates: (T[] | null | undefined)[]
): T[] | undefined {
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }

  return undefined;
}

// required due to HMIS api not supporting PATCH
type TRequiredHmisFields = Required<
  Pick<
    UpdateHmisClientProfileInput,
    | 'gender'
    | 'raceEthnicity'
    | 'nameSuffix'
    | 'veteran'
    | 'nameMiddle'
    | 'genderIdentityText'
    | 'additionalRaceEthnicityDetail'
  >
>;

export function toUpdateHmisClientProfileInput(
  client: HmisClientProfileType,
  inputs: Partial<UpdateHmisClientProfileInput>
): UpdateHmisClientProfileInput | null {
  if (!inputs || !client) {
    return null;
  }

  // remove disallowed fields
  const { profilePhoto, ...safeInputs } = inputs;

  // normalize values: hmis API does not support PATCH, so we some values
  // must always be resent, or they can be cleared accidentally.
  const normalizedInputs: TRequiredHmisFields &
    Partial<UpdateHmisClientProfileInput> = {
    ...safeInputs,

    gender: firstNonEmptyArray(safeInputs.gender, client.gender) ?? [
      FALLBACK_GENDER,
    ],

    raceEthnicity: firstNonEmptyArray(
      safeInputs.raceEthnicity,
      client.raceEthnicity
    ) ?? [FALLBACK_RACE_ETHNICITY],

    nameSuffix:
      safeInputs.nameSuffix ?? client.nameSuffix ?? FALLBACK_NAME_SUFFIX,

    veteran: safeInputs.veteran ?? client.veteran ?? FALLBACK_VETERAN_STATUS,

    nameMiddle: safeInputs.nameMiddle ?? client.nameMiddle ?? '',

    genderIdentityText:
      safeInputs.genderIdentityText ?? client.genderIdentityText ?? '',

    additionalRaceEthnicityDetail:
      safeInputs.additionalRaceEthnicityDetail ??
      client.additionalRaceEthnicityDetail ??
      '',
  };

  return {
    id: client.id,
    ...normalizedInputs,
  };
}
