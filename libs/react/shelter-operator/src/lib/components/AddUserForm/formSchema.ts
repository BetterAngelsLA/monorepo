import { z } from 'zod';
import { PermissionTemplateEnum } from '../../apollo/graphql/__generated__/types';

export type TFormSchema = z.infer<typeof FormSchema>;

export const defaultValues: TFormSchema = {
  firstName: '',
  lastName: '',
  email: '',
  permissionTemplate:
    PermissionTemplateEnum.ShelterOperator as PermissionTemplateEnum,
};

export const FormSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email('Invalid email address.'),
  permissionTemplate: z.nativeEnum(PermissionTemplateEnum),
});
