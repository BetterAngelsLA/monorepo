import {
  HmisClientDataType,
  HmisClientProfileType,
  HmisDobQualityEnum,
  HmisGenderEnum,
  HmisNameQualityEnum,
  HmisRaceEnum,
  HmisSsnQualityEnum,
  HmisSuffixEnum,
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
  hmisId: string,
  values: Partial<UpdateHmisClientProfileInput>
): UpdateHmisClientProfileInput | null {
  if (!values || !hmisId) {
    return null;
  }

  const updatedInputs: UpdateHmisClientProfileInput = {
    hmisId,
    gender: values.gender || [HmisGenderEnum.NotCollected],
    raceEthnicity: values.raceEthnicity || [HmisRaceEnum.NotCollected],
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

  // const inputs: UpdateHmisClientProfileInput = {
  //   hmisId: hmisId,

  //   alias: values.alias,
  //   birthDate: values.birthDate,

  //   dobQuality: values.dobQuality,
  //   firstName: values.firstName,
  //   lastName: values.lastName,
  //   nameQuality: values.nameQuality,
  //   ssn1: values.ssn1,
  //   ssn2: values.ssn2,
  //   ssn3: values.ssn3,
  //   ssnQuality: values.ssnQuality,

  //   gender: values.gender || [HmisGenderEnum.NotCollected],
  //   genderIdentityText: values.genderIdentityText,
  //   nameMiddle: values.nameMiddle,
  //   nameSuffix: values.nameSuffix,
  //   raceEthnicity: values.raceEthnicity || [HmisRaceEnum.NotCollected],
  //   additionalRaceEthnicityDetail: values.additionalRaceEthnicityDetail,
  //   veteran: values.veteran,

  //   adaAccommodation: values.adaAccommodation,
  //   address: values.address,
  //   californiaId: values.californiaId,
  //   email: values.email,
  //   eyeColor: values.eyeColor,
  //   hairColor: values.hairColor,
  //   heightInInches: values.heightInInches,
  //   importantNotes: values.importantNotes,
  //   livingSituation: values.livingSituation,
  //   mailingAddress: values.mailingAddress,
  //   maritalStatus: values.maritalStatus,
  //   physicalDescription: values.physicalDescription,
  //   placeOfBirth: values.placeOfBirth,
  //   preferredCommunication: values.preferredCommunication,
  //   preferredLanguage: values.preferredLanguage,
  //   pronouns: values.pronouns,
  //   pronounsOther: values.pronounsOther,
  //   residenceAddress: values.residenceAddress,
  //   residenceGeolocation: values.residenceGeolocation,
  //   spokenLanguages: values.spokenLanguages,
  // };

  // return inputs;
}

// type THMISClienProfileInputs = {
//   clientInput: UpdateHmisClientProfileInput;
//   clientSubItemsInput: HmisUpdateClientSubItemsInput;
// };

// export function toHMISClientProfileInputs(
//   client: HmisClientProfileType
// ): UpdateHmisClientProfileInput {
//   const clientInput = toUpdateHmisClientProfileInput(client);

//   return clientInput;
// }
