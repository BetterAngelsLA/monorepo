import { TaskPersonRow } from '../../ui-components/TaskPersonRow';
import { TaskQuery } from './__generated__/Task.generated';

type TaskCreatedByProps = {
  createdBy: TaskQuery['task']['createdBy'];
  team?: TaskQuery['task']['team'];
  organization?: TaskQuery['task']['organization'];
};

export default function TaskCreatedBy(props: TaskCreatedByProps) {
  const { createdBy, team, organization } = props;

  const name = [createdBy?.firstName, createdBy?.lastName]
    .filter(Boolean)
    .join(' ');
  const secondary = [organization?.name, team?.name && `- ${team.name}`]
    .filter(Boolean)
    .join(' ');

  return (
    <TaskPersonRow
      variant="stacked"
      label="Created by"
      name={name}
      secondary={secondary}
    />
  );
}
