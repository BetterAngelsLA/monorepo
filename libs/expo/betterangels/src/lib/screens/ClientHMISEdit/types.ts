import { z } from 'zod';
import {
  HmisUpdateClientInput,
  HmisUpdateClientSubItemsInput,
} from '../../apollo';
import { SectionSchemas } from './basicForms/config';

type Flatten<T> = { [K in keyof T]: T[K] } & {};

export type SectionValues<K extends TSectionKey> = z.infer<
  (typeof SectionSchemas)[K]
>;

export type AnySectionValues = {
  [K in TSectionKey]: SectionValues<K>;
}[TSectionKey];

export type TClientUpdateFields = Partial<
  Flatten<HmisUpdateClientInput & HmisUpdateClientSubItemsInput>
>;

export type TSectionKey = keyof typeof SectionSchemas;

// type HasKeysOf<T> = { [K in keyof T]: unknown };
export type TFieldKeysOf<T extends object> = Partial<
  Readonly<Record<keyof T, boolean>>
>;
