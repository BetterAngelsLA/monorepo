import {
  HmisClientProfileType,
  HmisGenderEnum,
  HmisRaceEnum,
  UpdateHmisClientProfileInput,
} from '../../apollo';

export type TUpdateHmisClientProfileInputsUnion =
  Partial<HmisClientProfileType>;
export function toUpdateHmisClientProfileInput(
  client: HmisClientProfileType,
  values: Partial<UpdateHmisClientProfileInput>
): UpdateHmisClientProfileInput | null {
  if (!values || !client) {
    return null;
  }

  const updatedInputs: UpdateHmisClientProfileInput = {
    id: client.id,
    gender: values.gender || [HmisGenderEnum.NotCollected],
    raceEthnicity: values.raceEthnicity || [HmisRaceEnum.NotCollected],
    veteran: values.veteran || client.veteran,
  };

  if ('birthDate' in values && values.birthDate) {
    updatedInputs.birthDate = values.birthDate
      .toISOString()
      .split('T')[0] as unknown as Date;
  }

  if ('profilePhoto' in values) {
    delete values.profilePhoto;
  }

  return {
    ...values,
    ...updatedInputs,
  };
}
