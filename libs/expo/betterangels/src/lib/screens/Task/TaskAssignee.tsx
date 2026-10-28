import { StyleProp, ViewStyle } from 'react-native';
import { TaskPersonRow } from '../../ui-components/TaskPersonRow';
import { formatMemberName } from '../../util/formatMemberName';
import { TaskQuery } from './__generated__/Task.generated';

type TaskAssigneeProps = {
  assignee: NonNullable<TaskQuery['task']['assignee']>;
  style?: StyleProp<ViewStyle>;
};

export default function TaskAssignee(props: TaskAssigneeProps) {
  const { assignee, style } = props;

  return (
    <TaskPersonRow
      label="Assigned to"
      name={formatMemberName(assignee)}
      style={style}
    />
  );
}
