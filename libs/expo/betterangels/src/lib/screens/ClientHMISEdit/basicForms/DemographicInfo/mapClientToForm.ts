import { HmisClientProfileType } from '../../../../apollo';
import {
  demographicInfoFormEmptyState as emptyState,
  type TDemographicInfoFormSchema,
} from './formSchema';

export function mapClientToDemographicSchema(
  client: HmisClientProfileType
): TDemographicInfoFormSchema {
  const {
    gender,
    raceEthnicity,
    additionalRaceEthnicityDetail,
    genderIdentityText,
    placeOfBirth,
    physicalDescription,
    heightInInches,
    pronouns,
    eyeColor,
    hairColor,
    maritalStatus,
    adaAccommodation,
  } = client;

  return {
    gender: gender ?? emptyState.gender,
    raceEthnicity: raceEthnicity ?? emptyState.raceEthnicity,
    additionalRaceEthnicityDetail:
      additionalRaceEthnicityDetail ?? emptyState.additionalRaceEthnicityDetail,
    genderIdentityText: genderIdentityText ?? emptyState.genderIdentityText,
    placeOfBirth: placeOfBirth ?? emptyState.placeOfBirth,
    physicalDescription: physicalDescription ?? emptyState.physicalDescription,
    pronouns: pronouns ?? emptyState.pronouns,
    eyeColor: eyeColor ?? emptyState.eyeColor,
    hairColor: hairColor ?? emptyState.hairColor,
    maritalStatus: maritalStatus ?? emptyState.maritalStatus,
    adaAccommodation: adaAccommodation ?? emptyState.adaAccommodation,
    heightInInches:
      typeof heightInInches === 'number'
        ? String(heightInInches)
        : emptyState.heightInInches,
  };
}
