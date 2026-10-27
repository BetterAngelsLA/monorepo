import { StyleProp, ViewStyle } from 'react-native';
import { TaskPersonRow } from '../../ui-components/TaskPersonRow';
import { TaskQuery } from './__generated__/Task.generated';

type TaskClientProps = {
  clientProfile: TaskQuery['task']['clientProfile'];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function TaskClient(props: TaskClientProps) {
  const { clientProfile, onPress, style } = props;

  const fullName =
    `${clientProfile?.firstName ?? ''} ${clientProfile?.lastName ?? ''}`.trim();

  return (
    <TaskPersonRow
      label="Client"
      name={fullName}
      avatarUrl={clientProfile?.profilePhoto?.url}
      onPress={onPress}
      style={style}
      expandTouchTarget
      accessibilityLabel={
        onPress
          ? `Open client profile${fullName ? `: ${fullName}` : ''}`
          : undefined
      }
      accessibilityHint={onPress ? "Opens the client's profile" : undefined}
    />
  );
}
