import { z } from 'zod';
import { SelahTeamEnum, TaskStatusEnum } from '../../apollo';

export type TFormSchema = z.infer<typeof FormSchema>;

//   input CreateTaskInput {
//     clientProfile: ID
//     description: String
//     note: ID
//     summary: String!
//     team: SelahTeamEnum
//     status: TaskStatusEnum
//   }

export const emptyState: TFormSchema = {
  summary: '',
  team: '',
  description: '',
  status: TaskStatusEnum.ToDo,
};

export const FormSchema = z.object({
  summary: z.string().min(1, 'Title is required.'),
  team: z.enum(SelahTeamEnum).or(z.literal('')),
  description: z.string(),
  status: z.enum(TaskStatusEnum, {
    error: () => 'Status is required',
  }),
});
