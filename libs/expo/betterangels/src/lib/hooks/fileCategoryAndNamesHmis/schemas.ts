import { z } from 'zod';

export const FileCategorySchemaHmis = z.object({
  id: z.number(),
  name: z.string(),
  status: z.number(),
  description: z.string().optional(),
});

export const FileNameSchemaHmis = z.object({
  id: z.number(),
  name: z.string(),
  ref_category: z.number(),
  status: z.number(),
});

export const FileCategoriesArraySchemaHmis = z.array(FileCategorySchemaHmis);
export const FileNamesArraySchemaHmis = z.array(FileNameSchemaHmis);
