import { z } from 'zod';
import { PermissionTemplateEnum } from '@monorepo/ba-platform/types';

export type TFormSchema = z.infer<typeof FormSchema>;

export const defaultValues: TFormSchema = {
  firstName: '',
  lastName: '',
  email: '',
  permissionTemplate: PermissionTemplateEnum.Caseworker,
};

export const FormSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email('Invalid email address.'),
  permissionTemplate: z.enum(PermissionTemplateEnum),
});
