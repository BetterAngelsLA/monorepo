import {
  HmisClientDataType,
  HmisClientProfileType,
  HmisGenderEnum,
  HmisRaceEnum,
  UpdateHmisClientProfileInput,
} from '../../apollo';

export type TUpdateHmisClientProfileInputsUnion = Partial<
  HmisClientProfileType & HmisClientDataType
>;
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

  if ('profilePhoto' in values) {
    delete values.profilePhoto;
  }

  return {
    ...values,
    ...updatedInputs,
  };
}
