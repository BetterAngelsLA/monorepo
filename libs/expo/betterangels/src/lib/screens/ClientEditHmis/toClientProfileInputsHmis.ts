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

export function toUpdateClientProfileInputHmis(
  client: HmisClientProfileType,
  inputs: Partial<UpdateHmisClientProfileInput>,
): UpdateHmisClientProfileInput | null {
  if (!inputs || !client) {
    return null;
  }

  // normalize values: hmis API does not support PATCH, so we some values
  // must always be resent, or they can be cleared accidentally.
  const normalizedInputs: TRequiredHmisFields &
    Partial<UpdateHmisClientProfileInput> = {
    ...inputs,

    gender: firstNonEmptyArray(inputs.gender, client.gender) ?? [
      FALLBACK_GENDER,
    ],

    raceEthnicity: firstNonEmptyArray(
      inputs.raceEthnicity,
      client.raceEthnicity,
    ) ?? [FALLBACK_RACE_ETHNICITY],

    nameSuffix: inputs.nameSuffix ?? client.nameSuffix ?? FALLBACK_NAME_SUFFIX,

    veteran: inputs.veteran ?? client.veteran ?? FALLBACK_VETERAN_STATUS,

    nameMiddle: inputs.nameMiddle ?? client.nameMiddle ?? '',

    genderIdentityText:
      inputs.genderIdentityText ?? client.genderIdentityText ?? '',

    additionalRaceEthnicityDetail:
      inputs.additionalRaceEthnicityDetail ??
      client.additionalRaceEthnicityDetail ??
      '',
  };

  return {
    id: client.id,
    ...normalizedInputs,
  };
}
