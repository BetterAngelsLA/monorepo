import { HmisClientProfileType } from '@monorepo/ba-platform/types';
import { HmisProdClientSearchItem } from '../api';

/**
 * Map a Clarity client search item to the shape `ClientCardHmis` expects.
 *
 * `hmisId` drives the authenticated photo-thumb endpoint, so it maps from the
 * Clarity `id`.
 *
 * TODO: `HmisClientProfileType` is the BA GraphQL type; we cast because the
 * card only consumes this subset. Replace with a dedicated card type when one
 * exists.
 */
export const clientSearchItemToHmisClientProfileType = (
  item: HmisProdClientSearchItem,
): HmisClientProfileType =>
  ({
    id: String(item.id),
    hmisId: String(item.id),
    firstName: item.first_name ?? null,
    lastName: item.last_name ?? null,
    alias: item.alias ?? null,
    birthDate: item.birth_date ?? null,
    age: item.age ?? null,
    nameSuffix: item.name_suffix ?? null,
    uniqueIdentifier: item.unique_identifier ?? null,
  }) as unknown as HmisClientProfileType;
