import { ComponentType } from 'react';
import { z, ZodType } from 'zod';
import { HmisClientType } from '../../apollo';
import { hmisFormConfig } from './basicForms/config';

export type TSectionConfig<S extends ZodType<any, any, any>> = {
  title: string;
  Form: ComponentType<any>;
  schema: S;
  emptyState: z.input<S>;
  dataMapper: (client: HmisClientType) => z.input<S>;
};

export type THmisFormSectionKey = keyof typeof hmisFormConfig;
