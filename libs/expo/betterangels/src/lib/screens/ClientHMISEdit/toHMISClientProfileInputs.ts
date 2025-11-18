import {
  HmisClientDataType,
  HmisClientType,
  HmisDobQualityEnum,
  HmisGenderEnum,
  HmisNameQualityEnum,
  HmisRaceEnum,
  HmisSsnQualityEnum,
  HmisSuffixEnum,
  HmisUpdateClientInput,
  HmisUpdateClientSubItemsInput,
  HmisVeteranStatusEnum,
  Maybe,
} from '../../apollo';
import {
  toGenderEnumInt,
  toHmisDobQualityEnumInt,
  toHmisNameQualityInt,
  toHmisSsnQualityEnumInt,
  toHmisSuffixEnumInt,
  toHmisVeteranStatusEnumInt,
  toRaceEnumInt,
} from '../../static';
import {
  FALLBACK_DOB_DATA_QUALITY_INT,
  FALLBACK_GENDER_INT,
  FALLBACK_NAME_DATA_QUALITY_INT,
  FALLBACK_NAME_SUFFIX_INT,
  FALLBACK_RACE_ETHNICITY_INT,
  FALLBACK_SSN_1,
  FALLBACK_SSN_2,
  FALLBACK_SSN_3,
  FALLBACK_SSN_DATA_QUALITY_INT,
  FALLBACK_VETERAN_STATUS_INT,
} from './constants';

export type TUpdateClientInputsUnion = Partial<
  HmisClientType & HmisClientDataType
>;

function toNameDataQualityInput(
  value?: Maybe<HmisNameQualityEnum> | ''
): number {
  return toHmisNameQualityInt(value) ?? FALLBACK_NAME_DATA_QUALITY_INT;
}

function toDobDataQualityInput(value?: Maybe<HmisDobQualityEnum> | ''): number {
  return toHmisDobQualityEnumInt(value) ?? FALLBACK_DOB_DATA_QUALITY_INT;
}

function toNameSuffixInput(value?: HmisSuffixEnum | null | ''): number {
  return toHmisSuffixEnumInt(value) ?? FALLBACK_NAME_SUFFIX_INT;
}

function toSsnDataQualityInput(value?: HmisSsnQualityEnum | null | ''): number {
  return toHmisSsnQualityEnumInt(value) ?? FALLBACK_SSN_DATA_QUALITY_INT;
}

function toHmisVeteranStatusInput(
  value?: Maybe<HmisVeteranStatusEnum> | ''
): number {
  return toHmisVeteranStatusEnumInt(value) ?? FALLBACK_VETERAN_STATUS_INT;
}

function toGenderInput(values?: HmisGenderEnum[]): number[] {
  const out = (values || [])
    .map((val) => {
      return toGenderEnumInt(val);
    })
    .filter((v) => v !== null);

  if (out.length) {
    return out as number[];
  }

  return [FALLBACK_GENDER_INT];
}

function toRaceEthnicityInput(values?: HmisRaceEnum[]): number[] {
  const out = (values || [])
    .map((val) => {
      return toRaceEnumInt(val);
    })
    .filter((v) => v !== null);

  console.log('out 1');
  console.log(out);

  if (out.length) {
    return out as number[];
  }

  return [FALLBACK_RACE_ETHNICITY_INT];
}

function toStringInput(value?: string | null): string {
  return value || '';
}

export function toHmisUpdateClientSubItemsInput(
  client: HmisClientType,
  values: TUpdateClientInputsUnion,
  formKeys: string[]
): HmisUpdateClientSubItemsInput {
  const inputs: HmisUpdateClientSubItemsInput = {
    middleName: client.data?.middleName || '',
    nameSuffix: toNameSuffixInput(client.data?.nameSuffix),
    alias: values.alias || '',
    additionalRaceEthnicity: values.additionalRaceEthnicity || '',
    differentIdentityText: values.differentIdentityText || '',
    gender: toGenderInput(values.gender),
    raceEthnicity: toRaceEthnicityInput(values.raceEthnicity),
    veteranStatus: FALLBACK_VETERAN_STATUS_INT,
  };

  // override with values from form
  for (const key of formKeys) {
    if (key === 'middleName') {
      inputs.middleName = toStringInput(values.middleName);

      continue;
    }

    if (key === 'alias') {
      inputs.alias = toStringInput(values.alias);

      continue;
    }

    if (key === 'nameSuffix') {
      inputs.nameSuffix = toNameSuffixInput(values.nameSuffix);

      continue;
    }

    if (key === 'gender') {
      inputs.gender = toGenderInput(values.gender);

      continue;
    }

    if (key === 'raceEthnicity') {
      inputs.raceEthnicity = toRaceEthnicityInput(values.raceEthnicity);

      continue;
    }

    if (key === 'additionalRaceEthnicity') {
      inputs.additionalRaceEthnicity = toStringInput(
        values.additionalRaceEthnicity
      );

      continue;
    }

    if (key === 'differentIdentityText') {
      inputs.differentIdentityText = toStringInput(
        values.differentIdentityText
      );

      continue;
    }

    if (key === 'veteranStatus') {
      inputs.veteranStatus = toHmisVeteranStatusInput(values.veteranStatus);

      continue;
    }

    // ... update for future Form fields
  }

  return inputs;
}

export function toHmisUpdateClientInput(
  client: HmisClientType,
  values: TUpdateClientInputsUnion,
  formKeys: string[]
): HmisUpdateClientInput {
  const inputs: HmisUpdateClientInput = {
    personalId: client.personalId || '',
    firstName: toStringInput(client.firstName),
    lastName: client.lastName || '',
    nameDataQuality: toNameDataQualityInput(client.nameDataQuality),
    ssn1: FALLBACK_SSN_1,
    ssn2: FALLBACK_SSN_2,
    ssn3: FALLBACK_SSN_3,
    ssnDataQuality: toSsnDataQualityInput(client.ssnDataQuality),
    dob: client.dob || '',
    dobDataQuality: toDobDataQualityInput(client.dobDataQuality),
  };

  // override with values from form
  for (const key of formKeys) {
    if (key === 'firstName') {
      inputs.firstName = toStringInput(values.firstName);

      continue;
    }

    if (key === 'lastName') {
      inputs.lastName = toStringInput(values.lastName);

      continue;
    }

    if (key === 'nameDataQuality') {
      inputs.nameDataQuality = toNameDataQualityInput(values.nameDataQuality);

      continue;
    }

    if (key === 'dobDataQuality') {
      inputs.dobDataQuality = toDobDataQualityInput(values.dobDataQuality);

      continue;
    }

    if (key === 'dob') {
      inputs.dob = values.dob || '';

      continue;
    }
    // ... update for future Form fields
  }

  return inputs;
}

type THMISClienProfileInputs = {
  clientInput: HmisUpdateClientInput;
  clientSubItemsInput: HmisUpdateClientSubItemsInput;
};

export function toHMISClientProfileInputs(
  client: HmisClientType,
  formKeys: string[],
  values: TUpdateClientInputsUnion
): THMISClienProfileInputs {
  const clientInput = toHmisUpdateClientInput(client, values, formKeys);
  const clientSubItemsInput = toHmisUpdateClientSubItemsInput(
    client,
    values,
    formKeys
  );

  return {
    clientInput,
    clientSubItemsInput,
  };
}
