import { TasksQuery } from './__generated__/Tasks.generated';

export type TClientProfile = TasksQuery['tasks']['results'][number];

export type ListHeaderProps = {
  totalTasks: number;
  visibleTasks: number;
};
