import { TaskPersonRow } from '../TaskPersonRow';
import { TasksQuery } from '../TaskList/__generated__/Tasks.generated';

type TaskCardCreatedByProps = {
  createdBy: TasksQuery['tasks']['results'][number]['createdBy'];
  team?: { name?: string | null } | null;
  organization?: TasksQuery['tasks']['results'][number]['organization'];
};

export default function TaskCardCreatedBy(props: TaskCardCreatedByProps) {
  const { createdBy, team, organization } = props;

  const name = [createdBy?.firstName, createdBy?.lastName]
    .filter(Boolean)
    .join(' ');
  const secondary = [organization?.name, team?.name && `- ${team.name}`]
    .filter(Boolean)
    .join(' ');

  return <TaskPersonRow label="Created by" name={name} secondary={secondary} />;
}
