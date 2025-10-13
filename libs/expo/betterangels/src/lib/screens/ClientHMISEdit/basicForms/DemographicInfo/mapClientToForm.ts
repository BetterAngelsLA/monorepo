import { HmisClientType } from '../../../../apollo';
import { emptyState, type TFormSchema } from './formSchema';

export function mapClientToDemographicSchema(
  client: HmisClientType
): TFormSchema {
  const { data } = client;
  const { gender } = data || {};

  return {
    gender: gender ?? emptyState.gender,
  };
}
