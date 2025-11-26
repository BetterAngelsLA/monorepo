import { ZodType } from 'zod';
import { ClientProfileSectionEnum } from '../../../screenRouting';
import { THmisFormSectionKey, TSectionConfig } from '../types';
import {
  DemographicInfoFormHmis,
  DemographicInfoFormSchema,
  demographicInfoFormEmptyState,
  mapClientToDemographicSchema,
} from './DemographicInfo';
import {
  FullNameFormHmis,
  FullNameFormSchema,
  fullNameFormEmptyState,
  mapClientToFullNameSchema,
} from './FullName';
import {
  PersonalInfoFormHmis,
  PersonalInfoFormSchema,
  PersonalInfoFormSchemaOut,
  mapClientToPersonalInfoSchema,
  personalInfoFormEmptyState,
} from './PersonalInfo';

export const hmisFormConfig = {
  [ClientProfileSectionEnum.FullName]: {
    title: 'Edit Full Name',
    Form: FullNameFormHmis,
    schema: FullNameFormSchema,
    schemaOutput: undefined,
    emptyState: fullNameFormEmptyState,
    dataMapper: mapClientToFullNameSchema,
  },
  [ClientProfileSectionEnum.Demographic]: {
    title: 'Edit Demographic Info',
    Form: DemographicInfoFormHmis,
    schema: DemographicInfoFormSchema,
    schemaOutput: undefined,
    emptyState: demographicInfoFormEmptyState,
    dataMapper: mapClientToDemographicSchema,
  },
  [ClientProfileSectionEnum.PersonalInfo]: {
    title: 'Edit Personal Info',
    Form: PersonalInfoFormHmis,
    schema: PersonalInfoFormSchema,
    schemaOutput: PersonalInfoFormSchemaOut,
    emptyState: personalInfoFormEmptyState,
    dataMapper: mapClientToPersonalInfoSchema,
  },
} as const satisfies Partial<
  Record<ClientProfileSectionEnum, TSectionConfig<ZodType<any, any, any>>>
>;

export function parseAsSectionKeyHMIS(
  value: unknown
): THmisFormSectionKey | null {
  if (typeof value === 'string' && value in hmisFormConfig) {
    return value as THmisFormSectionKey;
  }

  return null;
}
