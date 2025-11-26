import { ComponentType } from 'react';
import { z } from 'zod';
import {
  HmisClientProfileType,
  UpdateHmisClientProfileInput,
} from '../../apollo';
import { hmisFormConfig } from './basicForms/config';

export type TSectionConfig<TSchema extends z.ZodTypeAny> = {
  title: string;
  Form: ComponentType;
  schema: TSchema;
  // Optional “output schema” that takes the form input type (TInput)
  // and returns a value that is safe to send to the API.
  schemaOutput?: {
    parse: (input: z.input<TSchema>) => Partial<UpdateHmisClientProfileInput>;
  };
  // RHF default values — same type as the schema input.
  emptyState: z.input<TSchema>;
  // Maps the GraphQL client profile into form values (same as schema input type).
  dataMapper: (client: HmisClientProfileType) => z.input<TSchema>;
};

export type THmisFormSectionKey = keyof typeof hmisFormConfig;
export type TSectionConfigRecord = TSectionConfig<z.ZodTypeAny>;
