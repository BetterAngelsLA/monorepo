import {
  HmisClientDataType,
  HmisClientType,
  HmisDobQualityEnum,
  HmisNameQualityEnum,
  HmisSsnQualityEnum,
  HmisSuffixEnum,
  HmisUpdateClientInput,
  HmisUpdateClientSubItemsInput,
  Maybe,
} from '../../apollo';
import {
  toHmisDobQualityEnumInt,
  toHmisNameQualityInt,
  toHmisSsnQualityEnumInt,
  toHmisSuffixEnumInt,
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
    gender: [FALLBACK_GENDER_INT],
    raceEthnicity: [FALLBACK_RACE_ETHNICITY_INT],
    veteranStatus: FALLBACK_VETERAN_STATUS_INT,
  };

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

    // TODO: update for future Form fields
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

    // TODO: update for future Form fields
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
