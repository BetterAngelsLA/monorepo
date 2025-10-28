import { HmisClientType } from '../../../../apollo';
import {
  fullNameFormEmptyState as emptyState,
  type TFullNameFormSchema,
} from './formSchema';

export function mapClientToFullNameSchema(
  client: HmisClientType
): TFullNameFormSchema {
  const { firstName, lastName, nameDataQuality, data } = client;
  const { middleName, alias, nameSuffix } = data || {};

  return {
    firstName: firstName || emptyState.firstName,
    middleName: middleName || emptyState.middleName,
    lastName: lastName || emptyState.lastName,
    alias: alias || emptyState.alias,
    nameDataQuality: nameDataQuality ?? emptyState.nameDataQuality,
    nameSuffix: nameSuffix ?? emptyState.nameSuffix,
  };
}
