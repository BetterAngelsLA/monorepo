import { ComponentType } from 'react';
import { z, ZodType } from 'zod';
import { HmisClientProfileType } from '../../apollo';
import { hmisFormConfig } from './basicForms/config';

export type TSectionConfig<S extends ZodType<any, any, any>> = {
  title: string;
  Form: ComponentType<any>;
  schema: S;
  schemaOutput: S | undefined;
  emptyState: z.input<S>;
  dataMapper: (client: HmisClientProfileType) => z.input<S>;
};

export type THmisFormSectionKey = keyof typeof hmisFormConfig;
