import { z } from 'zod';

export type TFormSchema = z.infer<typeof FormSchema>;

export const emptyState: TFormSchema = {
  firstName: '',
  lastName: '',
};

export const FormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export const formFieldNames = ['firstName', 'lastName'] as const;
