import { TaskType } from '../../apollo';
import { formatMemberName } from '../../util/formatMemberName';
import { TaskPersonRow } from '../TaskPersonRow';

type TaskCardAssigneeProps = {
  assignee: NonNullable<TaskType['assignee']>;
  compact?: boolean;
};

export default function TaskCardAssignee(props: TaskCardAssigneeProps) {
  const { assignee } = props;

  return (
    <TaskPersonRow label="Assigned to" name={formatMemberName(assignee)} />
  );
}
