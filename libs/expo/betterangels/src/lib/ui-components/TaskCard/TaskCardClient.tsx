import { TaskPersonRow } from '../TaskPersonRow';

type TaskCardClientProps = {
  firstName?: string | null;
  lastName?: string | null;
  profilePhotoUrl?: string | null;
  onPress?: () => void;
  compact?: boolean;
};

export default function TaskCardClient(props: TaskCardClientProps) {
  const { firstName, lastName, profilePhotoUrl, onPress, compact } = props;

  if (!firstName && !lastName && !profilePhotoUrl) {
    return null;
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  return (
    <TaskPersonRow
      label="Client"
      name={fullName}
      compact={compact}
      avatarUrl={profilePhotoUrl}
      onPress={onPress}
      accessibilityLabel={
        onPress
          ? `Open client profile${fullName ? `: ${fullName}` : ''}`
          : undefined
      }
      accessibilityHint={onPress ? "Opens the client's profile" : undefined}
    />
  );
}
