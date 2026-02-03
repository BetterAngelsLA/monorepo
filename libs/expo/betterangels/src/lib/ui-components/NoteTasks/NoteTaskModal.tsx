import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SelahTeamEnum, UpdateTaskInput } from '../../apollo';
import { useModalScreen } from '../../providers';
import { TaskForm } from '../TaskForm';

interface INoteTasksModalProps {
  clientProfileId: string;
  noteId: string;
  refetch: () => void;
  team?: SelahTeamEnum | null;
  task?: UpdateTaskInput;
}

export default function NoteTasksModal(props: INoteTasksModalProps) {
  const { clientProfileId, noteId, refetch, team, task } = props;

  const { closeModalScreen } = useModalScreen();
  const { top: topInset } = useSafeAreaInsets();

  const closeModal = () => {
    closeModalScreen();
  };

  const onSuccess = () => {
    refetch();
    closeModal();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.WHITE,
        paddingTop: topInset,
      }}
    >
      <View
        style={{
          alignItems: 'flex-end',
          paddingHorizontal: 24,
          marginBottom: 4,
        }}
      >
        <IconButton
          onPress={closeModal}
          accessibilityHint="closes the modal"
          accessibilityLabel="Close modal"
          variant="transparent"
        >
          <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />
        </IconButton>
      </View>
      <TaskForm
        clientProfileId={clientProfileId}
        onCancel={closeModal}
        task={task}
        team={team}
        onSuccess={onSuccess}
        noteId={noteId}
      />
    </View>
  );
}
