import { z } from 'zod';

export type TFormSchema = z.infer<typeof FormSchema>;

export const defaultValues: TFormSchema = {
  firstName: 'asdf',
  lastName: 'asfd',
  email: 'asdf@asdf.com',
};

export const FormSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.email('Invalid email address.'),
});
