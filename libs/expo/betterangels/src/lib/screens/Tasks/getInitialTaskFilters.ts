import { SelahTeamEnum, TaskStatusEnum } from '../../apollo';
import { enumDisplaySelahTeam, enumDisplayTaskStatus } from '../../static';
import { TModelFilters } from '../../ui-components';

export function getInitialTaskFilters({
  teamPreference,
}: {
  teamPreference?: SelahTeamEnum | null;
}): TModelFilters {
  return {
    taskStatus: [
      { id: TaskStatusEnum.ToDo, label: enumDisplayTaskStatus.TO_DO },
      {
        id: TaskStatusEnum.InProgress,
        label: enumDisplayTaskStatus.IN_PROGRESS,
      },
    ],
    teams: teamPreference
      ? [{ id: teamPreference, label: enumDisplaySelahTeam[teamPreference] }]
      : [],
  };
}
