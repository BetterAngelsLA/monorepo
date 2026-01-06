import { SelahTeamEnum, TaskStatusEnum } from '../../apollo';
import { TUser } from '../../providers/user/UserContext';
import { enumDisplaySelahTeam, enumDisplayTaskStatus } from '../../static';
import { TModelFilters } from '../../ui-components';

export function getInitialTaskFilters({
  user,
  teamPreference,
}: {
  user?: TUser;
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
    authors: user ? [{ id: user.id, label: 'Me' }] : [],
    teams: teamPreference
      ? [{ id: teamPreference, label: enumDisplaySelahTeam[teamPreference] }]
      : [],
  };
}
