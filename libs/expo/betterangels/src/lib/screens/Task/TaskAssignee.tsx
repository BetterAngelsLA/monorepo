import { TaskPersonRow } from '../../ui-components/TaskPersonRow';
import { formatMemberName } from '../../util/formatMemberName';
import { TaskQuery } from './__generated__/Task.generated';

type TaskAssigneeProps = {
  assignee: NonNullable<TaskQuery['task']['assignee']>;
};

export default function TaskAssignee(props: TaskAssigneeProps) {
  const { assignee } = props;

  return (
    <TaskPersonRow
      variant="stacked"
      label="Assigned to"
      name={formatMemberName(assignee)}
    />
  );
}
