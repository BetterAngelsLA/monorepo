import { toLocalCalendarDate } from '@monorepo/expo/shared/utils';
import { HmisClientProfileType } from '../../../../apollo';
import {
  personalInfoFormEmptyState as emptyState,
  type TPersonalInfoFormSchema,
} from './formSchema';

export function mapClientToPersonalInfoSchema(
  client: HmisClientProfileType
): TPersonalInfoFormSchema {
  const {
    birthDate,
    dobQuality,
    veteran,
    livingSituation,
    preferredLanguage,
    californiaId,
  } = client;

  const mappedBirthDate =
    toLocalCalendarDate(birthDate ?? undefined) ?? emptyState.birthDate;

  return {
    birthDate: mappedBirthDate,
    dobQuality: dobQuality ?? emptyState.dobQuality,
    veteran: veteran ?? emptyState.veteran,
    livingSituation: livingSituation ?? emptyState.livingSituation,
    preferredLanguage: preferredLanguage ?? emptyState.preferredLanguage,
    californiaId: californiaId ?? emptyState.californiaId,
  };
}
