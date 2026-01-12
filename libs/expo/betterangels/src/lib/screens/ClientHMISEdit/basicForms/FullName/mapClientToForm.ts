import { HmisClientProfileType } from '../../../../apollo';
import {
  fullNameFormEmptyState as emptyState,
  type TFullNameFormSchema,
} from './formSchema';

export function mapClientToFullNameSchema(
  client: HmisClientProfileType
): TFullNameFormSchema {
  const { firstName, lastName, nameMiddle, alias, nameSuffix, nameQuality } =
    client;

  return {
    firstName: firstName || emptyState.firstName,
    nameMiddle: nameMiddle || emptyState.nameMiddle,
    lastName: lastName || emptyState.lastName,
    alias: alias || emptyState.alias,
    nameQuality: nameQuality ?? emptyState.nameQuality,
    nameSuffix: nameSuffix ?? emptyState.nameSuffix,
  };
}
