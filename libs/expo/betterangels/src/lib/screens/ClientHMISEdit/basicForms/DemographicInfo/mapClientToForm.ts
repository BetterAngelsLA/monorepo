import { HmisClientType } from '../../../../apollo';
import {
  demographicInfoFormEmptyState as emptyState,
  type TDemographicInfoFormSchema,
} from './formSchema';

export function mapClientToDemographicSchema(
  client: HmisClientType
): TDemographicInfoFormSchema {
  const { data } = client;
  const { gender, additionalRaceEthnicity, differentIdentityText } = data || {};

  return {
    gender: gender ?? emptyState.gender,
    additionalRaceEthnicity:
      additionalRaceEthnicity ?? emptyState.additionalRaceEthnicity,
    differentIdentityText:
      differentIdentityText ?? emptyState.differentIdentityText,
  };
}
