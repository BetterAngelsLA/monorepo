import { HmisClientType } from '../../../../apollo';
import {
  demographicInfoFormEmptyState as emptyState,
  type TDemographicInfoFormSchema,
} from './formSchema';

export function mapClientToDemographicSchema(
  client: HmisClientType
): TDemographicInfoFormSchema {
  const { data } = client;
  const {
    gender,
    raceEthnicity,
    additionalRaceEthnicity,
    differentIdentityText,
  } = data || {};

  return {
    gender: gender ?? emptyState.gender,
    raceEthnicity: raceEthnicity ?? emptyState.raceEthnicity,
    additionalRaceEthnicity:
      additionalRaceEthnicity ?? emptyState.additionalRaceEthnicity,
    differentIdentityText:
      differentIdentityText ?? emptyState.differentIdentityText,
  };
}
