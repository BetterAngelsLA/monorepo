import { z } from 'zod';

export const HmisFileCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.number(),
  description: z.string().optional(),
});

export const HmisFileNameSchema = z.object({
  id: z.number(),
  // hello: z.string(),
  name: z.string(),
  ref_category: z.number(),
  status: z.number(),
});

export const HmisFileCategoriesArraySchema = z.array(HmisFileCategorySchema);
export const HmisFileNamesArraySchema = z.array(HmisFileNameSchema);
