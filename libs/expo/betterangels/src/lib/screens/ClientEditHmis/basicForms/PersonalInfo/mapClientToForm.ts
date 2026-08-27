import { parseDateString } from '@monorepo/shared/scalars';
import { HmisClientProfileType } from '../../../../apollo';
import {
  personalInfoFormEmptyState as emptyState,
  type TPersonalInfoFormSchema,
} from './formSchema';

export function mapClientToPersonalInfoSchema(
  client: HmisClientProfileType,
): TPersonalInfoFormSchema {
  const {
    birthDate,
    dobQuality,
    veteran,
    livingSituation,
    preferredLanguage,
    californiaId,
    unhousedStartDate,
  } = client;

  const mappedBirthDate =
    parseDateString(birthDate ?? undefined) ?? emptyState.birthDate;

  return {
    birthDate: mappedBirthDate,
    dobQuality: dobQuality ?? emptyState.dobQuality,
    veteran: veteran ?? emptyState.veteran,
    livingSituation: livingSituation ?? emptyState.livingSituation,
    preferredLanguage: preferredLanguage ?? emptyState.preferredLanguage,
    californiaId: californiaId ?? emptyState.californiaId,
    unhousedStartDate: unhousedStartDate ?? emptyState.unhousedStartDate,
  };
}
