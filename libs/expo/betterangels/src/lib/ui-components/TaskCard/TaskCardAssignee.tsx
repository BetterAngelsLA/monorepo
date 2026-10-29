import { StyleProp, ViewStyle } from 'react-native';
import { TaskType } from '../../apollo';
import { formatMemberName } from '../../util/formatMemberName';
import { TaskPersonRow } from '../TaskPersonRow';

type TaskCardAssigneeProps = {
  assignee: NonNullable<TaskType['assignee']>;
  style?: StyleProp<ViewStyle>;
};

export default function TaskCardAssignee(props: TaskCardAssigneeProps) {
  const { assignee, style } = props;

  return (
    <TaskPersonRow
      label="Assigned to"
      name={formatMemberName(assignee)}
      style={style}
    />
  );
}
