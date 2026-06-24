import { z } from 'zod';
import { SelahTeamEnum, TaskStatusEnum } from '../../apollo';

export type TFormSchema = z.infer<typeof FormSchema>;

export const emptyState: TFormSchema = {
  id: '',
  summary: '',
  team: null,
  description: '',
  status: TaskStatusEnum.ToDo,
};

export const FormSchema = z.object({
  id: z.string().optional(),
  summary: z.string().min(1, 'Title is required.').nullable(),
  team: z.enum(SelahTeamEnum).nullable(),
  description: z.string().nullable(),
  status: z
    .enum(TaskStatusEnum, {
      error: () => 'Status is required',
    })
    .nullable(),
});
