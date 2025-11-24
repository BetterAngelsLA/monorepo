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
  } = client || {};

  return {
    gender: gender ?? emptyState.gender,
    raceEthnicity: raceEthnicity ?? emptyState.raceEthnicity,
    additionalRaceEthnicityDetail:
      additionalRaceEthnicityDetail ?? emptyState.additionalRaceEthnicityDetail,
    genderIdentityText: genderIdentityText ?? emptyState.genderIdentityText,
  };
}
