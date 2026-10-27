import { TaskPersonRow } from '../../ui-components/TaskPersonRow';
import { TaskQuery } from './__generated__/Task.generated';

type TaskClientProps = {
  clientProfile: TaskQuery['task']['clientProfile'];
  onPress?: () => void;
};

export default function TaskClient(props: TaskClientProps) {
  const { clientProfile, onPress } = props;

  const fullName =
    `${clientProfile?.firstName ?? ''} ${clientProfile?.lastName ?? ''}`.trim();

  return (
    <TaskPersonRow
      variant="stacked"
      label="Client"
      name={fullName}
      avatarUrl={clientProfile?.profilePhoto?.url}
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
