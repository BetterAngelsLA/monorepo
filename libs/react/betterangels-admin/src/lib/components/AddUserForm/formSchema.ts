import { z } from 'zod';

export type TFormSchema = z.infer<typeof FormSchema>;

export const defaultValues: TFormSchema = {
  firstName: '',
  lastName: '',
  email: '',
};

export const FormSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email('Invalid email address.'),
});
