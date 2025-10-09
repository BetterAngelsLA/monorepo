import { z } from 'zod';
import { SectionSchemas } from './basicForms/config';

type TSectionValues<K extends TSectionKey> = z.infer<
  (typeof SectionSchemas)[K]
>;

export type TAnySectionValues = {
  [K in TSectionKey]: TSectionValues<K>;
}[TSectionKey];

export type TSectionKey = keyof typeof SectionSchemas;
