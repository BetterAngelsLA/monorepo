import {
  HmisClientDataType,
  HmisClientProfileType,
  HmisDobQualityEnum,
  HmisGenderEnum,
  HmisNameQualityEnum,
  HmisRaceEnum,
  HmisSsnQualityEnum,
  HmisSuffixEnum,
  HmisUpdateClientSubItemsInput,
  HmisVeteranStatusEnum,
  Maybe,
  UpdateHmisClientProfileInput,
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
  FALLBACK_SSN_DATA_QUALITY_INT,
  FALLBACK_VETERAN_STATUS_INT,
} from './constants';

export type TUpdateHmisClientProfileInputsUnion = Partial<
  HmisClientProfileType & HmisClientDataType
>;

function toNameQualityInput(value?: Maybe<HmisNameQualityEnum> | ''): number {
  return toHmisNameQualityInt(value) ?? FALLBACK_NAME_DATA_QUALITY_INT;
}

function toDobQualityInput(value?: Maybe<HmisDobQualityEnum> | ''): number {
  return toHmisDobQualityEnumInt(value) ?? FALLBACK_DOB_DATA_QUALITY_INT;
}

function toNameSuffixInput(value?: HmisSuffixEnum | null | ''): number {
  return toHmisSuffixEnumInt(value) ?? FALLBACK_NAME_SUFFIX_INT;
}

function toSsnQualityInput(value?: HmisSsnQualityEnum | null | ''): number {
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

// export function toHmisUpdateClientSubItemsInput(
//   client: HmisClientProfileType,
//   values: TUpdateHmisClientProfileInputsUnion,
//   formKeys: string[]
// ): HmisUpdateClientSubItemsInput {
//   const inputs: HmisUpdateClientSubItemsInput = {
//     middleName: client.data?.middleName || '',
//     nameSuffix: toNameSuffixInput(client.data?.nameSuffix),
//     alias: values.alias || '',
//     additionalRaceEthnicity: values.additionalRaceEthnicity || '',
//     differentIdentityText: values.differentIdentityText || '',
//     gender: toGenderInput(values.gender),
//     raceEthnicity: toRaceEthnicityInput(values.raceEthnicity),
//     veteranStatus: FALLBACK_VETERAN_STATUS_INT,
//   };

//   // override with values from form
//   for (const key of formKeys) {
//     if (key === 'middleName') {
//       inputs.middleName = toStringInput(values.middleName);

//       continue;
//     }

//     if (key === 'alias') {
//       inputs.alias = toStringInput(values.alias);

//       continue;
//     }

//     if (key === 'nameSuffix') {
//       inputs.nameSuffix = toNameSuffixInput(values.nameSuffix);

//       continue;
//     }

//     if (key === 'gender') {
//       inputs.gender = toGenderInput(values.gender);

//       continue;
//     }

//     if (key === 'raceEthnicity') {
//       inputs.raceEthnicity = toRaceEthnicityInput(values.raceEthnicity);

//       continue;
//     }

//     if (key === 'additionalRaceEthnicity') {
//       inputs.additionalRaceEthnicity = toStringInput(
//         values.additionalRaceEthnicity
//       );

//       continue;
//     }

//     if (key === 'differentIdentityText') {
//       inputs.differentIdentityText = toStringInput(
//         values.differentIdentityText
//       );

//       continue;
//     }

//     if (key === 'veteranStatus') {
//       inputs.veteranStatus = toHmisVeteranStatusInput(values.veteranStatus);

//       continue;
//     }

//     // ... update for future Form fields
//   }

//   return inputs;
// }

// export function toUpdateHmisClientProfileInput(
//   client: HmisClientProfileType,
//   values: HmisClientProfileType,
//   formKeys: string[]
// ): UpdateHmisClientProfileInput {
//   const inputs: UpdateHmisClientProfileInput = {
//     hmisId: client.hmisId || '',
//     firstName: toStringInput(client.firstName),
//     lastName: client.lastName || '',
//     nameQuality: client.nameQuality,
//     ssn1: FALLBACK_SSN_1,
//     ssn2: FALLBACK_SSN_2,
//     ssn3: FALLBACK_SSN_3,
//     ssnQuality: client.ssnQuality,
//     birthDate: client.birthDate,
//     dobQuality: client.dobQuality,
//   };

//   // override with values from form
//   for (const key of formKeys) {
//     if (key === 'firstName') {
//       inputs.firstName = toStringInput(values.firstName);

//       continue;
//     }

//     if (key === 'lastName') {
//       inputs.lastName = toStringInput(values.lastName);

//       continue;
//     }

//     if (key === 'nameQuality') {
//       inputs.nameQuality = toNameQualityInput(values.nameQuality);

//       continue;
//     }

//     if (key === 'dobQuality') {
//       inputs.dobQuality = toDobQualityInput(values.dobQuality);

//       continue;
//     }

//     if (key === 'dob') {
//       inputs.dob = values.dob || '';

//       continue;
//     }
//     // ... update for future Form fields
//   }

//   return inputs;
// }
export function toUpdateHmisClientProfileInput(
  client: HmisClientProfileType
): UpdateHmisClientProfileInput {
  const inputs: UpdateHmisClientProfileInput = {
    hmisId: client.hmisId || '',

    alias: client.alias,
    birthDate: client.birthDate,

    dobQuality: client.dobQuality,
    firstName: client.firstName,
    lastName: client.lastName,
    nameQuality: client.nameQuality,
    ssn1: client.ssn1,
    ssn2: client.ssn2,
    ssn3: client.ssn3,
    ssnQuality: client.ssnQuality,

    gender: client.gender || [HmisGenderEnum.NotCollected],
    genderIdentityText: client.genderIdentityText,
    nameMiddle: client.nameMiddle,
    nameSuffix: client.nameSuffix,
    raceEthnicity: client.raceEthnicity || [HmisRaceEnum.NotCollected],
    additionalRaceEthnicityDetail: client.additionalRaceEthnicityDetail,
    veteran: client.veteran,

    adaAccommodation: client.adaAccommodation,
    address: client.address,
    californiaId: client.californiaId,
    email: client.email,
    eyeColor: client.eyeColor,
    hairColor: client.hairColor,
    heightInInches: client.heightInInches,
    importantNotes: client.importantNotes,
    livingSituation: client.livingSituation,
    mailingAddress: client.mailingAddress,
    maritalStatus: client.maritalStatus,
    physicalDescription: client.physicalDescription,
    placeOfBirth: client.placeOfBirth,
    preferredCommunication: client.preferredCommunication,
    preferredLanguage: client.preferredLanguage,
    pronouns: client.pronouns,
    pronounsOther: client.pronounsOther,
    residenceAddress: client.residenceAddress,
    residenceGeolocation: client.residenceGeolocation,
    spokenLanguages: client.spokenLanguages,
  };

  return inputs;
}

// type THMISClienProfileInputs = {
//   clientInput: UpdateHmisClientProfileInput;
//   clientSubItemsInput: HmisUpdateClientSubItemsInput;
// };

export function toHMISClientProfileInputs(
  client: HmisClientProfileType
): UpdateHmisClientProfileInput {
  const clientInput = toUpdateHmisClientProfileInput(client);

  return clientInput;
}
