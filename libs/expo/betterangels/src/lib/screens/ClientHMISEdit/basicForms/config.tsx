import { zodResolver } from '@hookform/resolvers/zod';
import { ComponentType } from 'react';
import { z, ZodType } from 'zod';
import { HmisClientType } from '../../../apollo';
import { ClientProfileSectionEnum } from '../../../screenRouting';
import { THmisFormSectionKey, TSectionConfig } from '../types';
import {
  DemographicInfoForm,
  demographicInfoFormEmptyState,
  DemographicInfoFormSchema,
  mapClientToDemographicSchema,
} from './DemographicInfo';
import {
  fullNameFormEmptyState,
  FullNameFormHmis,
  FullNameFormSchema,
  mapClientToFullNameSchema,
} from './FullName';

function generateSectionConfig<S extends ZodType<any, any, any>>(config: {
  title: string;
  Form: ComponentType<any>;
  schema: S;
  emptyState: z.input<S>;
  dataMapper: (client: HmisClientType) => z.input<S>;
}): TSectionConfig<S> {
  return {
    ...config,
    resolver: zodResolver(config.schema),
  };
}

export const hmisFormConfig = {
  [ClientProfileSectionEnum.FullName]: generateSectionConfig({
    title: 'Edit Full Name',
    Form: FullNameFormHmis,
    schema: FullNameFormSchema,
    emptyState: fullNameFormEmptyState,
    dataMapper: mapClientToFullNameSchema,
  }),
  [ClientProfileSectionEnum.Demographic]: generateSectionConfig({
    title: 'Edit Demographic Info',
    Form: DemographicInfoForm,
    schema: DemographicInfoFormSchema,
    emptyState: demographicInfoFormEmptyState,
    dataMapper: mapClientToDemographicSchema,
  }),
} as const;

export function parseAsSectionKeyHMIS(
  value: unknown
): THmisFormSectionKey | null {
  if (typeof value === 'string' && value in hmisFormConfig) {
    return value as THmisFormSectionKey;
  }

  return null;
}
