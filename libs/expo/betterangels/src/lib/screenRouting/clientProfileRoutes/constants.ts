import { validateAsEnum } from '../../helpers/validateAsEnum';
import type { TRelatedModelSection, TStandardSection } from './types';

export enum ClientProfileSectionEnum {
  FullName = 'FullName',
  PersonalInfo = 'PersonalInfo',
  ImportantNotes = 'ImportantNotes',
  Demographic = 'Demographic',
  ContactInfo = 'ContactInfo',
  RelevantContacts = 'RelevantContacts',
  Household = 'Household',
  HmisIds = 'HmisIds',
}

export function isValidClientProfileSectionEnum(
  value: unknown,
): value is ClientProfileSectionEnum {
  return validateAsEnum(value, ClientProfileSectionEnum);
}

/**
 * The two route families own disjoint sets of sections. Validation against the
 * whole enum (`isValidClientProfileSectionEnum`) is not enough: a section can be
 * a valid enum member and still belong to the *other* family, in which case the
 * family-specific config map lookup that follows is `undefined`.
 */
const standardSections: ReadonlySet<unknown> = new Set<TStandardSection>([
  ClientProfileSectionEnum.FullName,
  ClientProfileSectionEnum.PersonalInfo,
  ClientProfileSectionEnum.ImportantNotes,
  ClientProfileSectionEnum.Demographic,
  ClientProfileSectionEnum.ContactInfo,
]);

const relatedModelSections: ReadonlySet<unknown> = new Set<TRelatedModelSection>([
  ClientProfileSectionEnum.HmisIds,
  ClientProfileSectionEnum.Household,
  ClientProfileSectionEnum.RelevantContacts,
]);

/** True only for sections rendered by the standard `/clients/:id/edit` forms. */
export function isStandardSection(value: unknown): value is TStandardSection {
  return standardSections.has(value);
}

/** True only for sections rendered by the related-model `/relations` routes. */
export function isRelatedModelSection(
  value: unknown,
): value is TRelatedModelSection {
  return relatedModelSections.has(value);
}

/** Section a standard-section route (`/clients/:id/edit`) falls back to. */
export const DEFAULT_STANDARD_SECTION: TStandardSection =
  ClientProfileSectionEnum.FullName;

/** Section a related-model route (`/clients/:id/relations[/add]`) falls back to. */
export const DEFAULT_RELATED_MODEL_SECTION: TRelatedModelSection =
  ClientProfileSectionEnum.RelevantContacts;

/**
 * The section a route renders arrives as the `componentName` search param, which
 * in-app navigation supplies via the `getEditClientProfileRoute`,
 * `getRelatedModelViewRoute` and `getRelatedModelAddRoute` helpers. A direct URL,
 * a bookmark or a refresh carries no such param, so fall back to the route
 * family's default section rather than throwing. Mirrors how `/client/[id]`
 * treats its optional `openCard` param.
 *
 * Resolution is family-aware: the fallback fixes the route family, and a
 * `componentName` that is valid but belongs to the other family resolves to that
 * family's default instead of reaching an unguarded config-map lookup. The
 * return type is the fallback's family, so the compiler rejects that section
 * value at the config map.
 */
export function getClientProfileSectionOrDefault(
  value: unknown,
  fallback: TStandardSection,
): TStandardSection;
// eslint-disable-next-line no-redeclare -- TS overload signature (false positive)
export function getClientProfileSectionOrDefault(
  value: unknown,
  fallback: TRelatedModelSection,
): TRelatedModelSection;
// eslint-disable-next-line no-redeclare -- TS implementation signature
export function getClientProfileSectionOrDefault(
  value: unknown,
  fallback: TStandardSection | TRelatedModelSection,
): TStandardSection | TRelatedModelSection {
  if (isStandardSection(fallback)) {
    return isStandardSection(value) ? value : fallback;
  }

  return isRelatedModelSection(value) ? value : fallback;
}
