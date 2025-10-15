import { HmisClientType } from '../../../../apollo';
import {
  personalInfoFormEmptyState as emptyState,
  type TPersonalInfoFormSchema,
} from './formSchema';

export function mapClientToPersonalInfoSchema(
  client: HmisClientType
): TPersonalInfoFormSchema {
  const { dob, dobDataQuality, data } = client;
  const { veteranStatus } = data || {};

  return {
    dob: dob || emptyState.dob,
    dobDataQuality: dobDataQuality ?? emptyState.dobDataQuality,
    veteranStatus: veteranStatus || emptyState.veteranStatus,
  };
}
