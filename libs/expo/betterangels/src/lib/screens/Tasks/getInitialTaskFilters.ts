import { TaskStatusEnum } from '../../apollo';
import { enumDisplayTaskStatus } from '../../static';
import { TModelFilters } from '../../ui-components';

export function getInitialTaskFilters({
  teamId,
  teamName,
}: {
  teamId?: string | null;
  teamName?: string | null;
}): TModelFilters {
  return {
    taskStatus: [
      { id: TaskStatusEnum.ToDo, label: enumDisplayTaskStatus.TO_DO },
      {
        id: TaskStatusEnum.InProgress,
        label: enumDisplayTaskStatus.IN_PROGRESS,
      },
    ],
    teamIds: teamId
      ? [{ id: teamId, label: teamName || `Team ${teamId}` }]
      : [],
  };
}
