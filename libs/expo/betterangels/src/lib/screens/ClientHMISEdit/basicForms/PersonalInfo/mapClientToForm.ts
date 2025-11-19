import { HmisClientProfileType } from '../../../../apollo';
import {
  personalInfoFormEmptyState as emptyState,
  type TPersonalInfoFormSchema,
} from './formSchema';

export function mapClientToPersonalInfoSchema(
  client: HmisClientProfileType
): TPersonalInfoFormSchema {
  const { birthDate, dobQuality, veteran } = client;

  return {
    birthDate: birthDate || emptyState.birthDate,
    dobQuality: dobQuality ?? emptyState.dobQuality,
    veteran: veteran || emptyState.veteran,
  };
}
