import { zodResolver } from '@hookform/resolvers/zod';
import { HmisClientType } from '../../../apollo';
import { ClientProfileSectionEnum } from '../../../screenRouting';
import { TSectionKey } from '../types';
import {
  FullNameFormHmis,
  FullNameFormSchema,
  fullNameFormEmptyState,
  mapClientToFullNameSchema,
} from './FullName';

// titles
export const SectionTitle: Partial<Record<ClientProfileSectionEnum, string>> = {
  [ClientProfileSectionEnum.FullName]: 'Edit Full Name',
} as const;

// forms
export const SectionForms = {
  [ClientProfileSectionEnum.FullName]: FullNameFormHmis,
} as const;

// schemas
export const SectionSchemas = {
  [ClientProfileSectionEnum.FullName]: FullNameFormSchema,
} as const;

// defaults
export const SectionDefaults = {
  [ClientProfileSectionEnum.FullName]: fullNameFormEmptyState,
} as const;

export function parseAsSectionKeyHMIS(value: unknown): TSectionKey | null {
  if (typeof value === 'string' && value in SectionSchemas) {
    return value as TSectionKey;
  }

  return null;
}

export function makeResolver(section: TSectionKey) {
  return zodResolver(SectionSchemas[section]);
}

const SectionMappingFnMap = {
  [ClientProfileSectionEnum.FullName]: mapClientToFullNameSchema,
} as const;

export function mapClientToForm<K extends TSectionKey>(
  section: K,
  client: HmisClientType
) {
  const mapperFn = SectionMappingFnMap[section];

  return mapperFn(client);
}
