import { StyleProp, ViewStyle } from 'react-native';
import { TaskPersonRow } from '../TaskPersonRow';

type TaskCardClientProps = {
  firstName?: string | null;
  lastName?: string | null;
  profilePhotoUrl?: string | null;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function TaskCardClient(props: TaskCardClientProps) {
  const { firstName, lastName, profilePhotoUrl, onPress, style } = props;

  if (!firstName && !lastName && !profilePhotoUrl) {
    return null;
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  return (
    <TaskPersonRow
      label="Client"
      name={fullName}
      avatarUrl={profilePhotoUrl}
      onPress={onPress}
      style={style}
      accessibilityLabel={
        onPress
          ? `Open client profile${fullName ? `: ${fullName}` : ''}`
          : undefined
      }
      accessibilityHint={onPress ? "Opens the client's profile" : undefined}
    />
  );
}
