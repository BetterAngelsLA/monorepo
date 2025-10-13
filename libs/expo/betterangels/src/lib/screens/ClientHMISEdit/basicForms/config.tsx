import { zodResolver } from '@hookform/resolvers/zod';
import { HmisClientType } from '../../../apollo';
import { ClientProfileSectionEnum } from '../../../screenRouting';
import { TSectionKey } from '../types';
import {
  emptyState as DemographicEmptyState,
  FormSchema as DemographicFormSchema,
  DemographicInfoForm,
  mapClientToDemographicSchema,
} from './DemographicInfo';
import {
  FormSchema as FNFormSchema,
  emptyState as FnEmptyState,
  FullNameForm,
  mapClientToFullNameSchema,
} from './FullName';

// titles
export const SectionTitle: Partial<Record<ClientProfileSectionEnum, string>> = {
  [ClientProfileSectionEnum.FullName]: 'Edit Full Name',
  [ClientProfileSectionEnum.Demographic]: 'Edit Demographic Info',
} as const;

// forms
export const SectionForms = {
  [ClientProfileSectionEnum.FullName]: FullNameForm,
  [ClientProfileSectionEnum.Demographic]: DemographicInfoForm,
} as const;

// schemas
export const SectionSchemas = {
  [ClientProfileSectionEnum.FullName]: FNFormSchema,
  [ClientProfileSectionEnum.Demographic]: DemographicFormSchema,
} as const;

// defaults
export const SectionDefaults = {
  [ClientProfileSectionEnum.FullName]: FnEmptyState,
  [ClientProfileSectionEnum.Demographic]: DemographicEmptyState,
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
  [ClientProfileSectionEnum.Demographic]: mapClientToDemographicSchema,
} as const;

export function mapClientToForm<K extends TSectionKey>(
  section: K,
  client: HmisClientType
) {
  const mapperFn = SectionMappingFnMap[section];

  return mapperFn(client);
}
