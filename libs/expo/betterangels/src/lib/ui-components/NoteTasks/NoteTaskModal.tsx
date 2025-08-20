import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SelahTeamEnum, UpdateTaskInput } from '../../apollo';
import { useModalScreen } from '../../providers';
import { TaskForm } from '../TaskForm';

interface INoteTasksModalProps {
  noteId: string;
  refetch: () => void;
  team?: SelahTeamEnum | null;
  task?: UpdateTaskInput;
}

export default function NoteTasksModal(props: INoteTasksModalProps) {
  const { noteId, refetch, team, task } = props;

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
        <Pressable
          accessible
          accessibilityHint="closes the modal"
          accessibilityRole="button"
          accessibilityLabel="close"
          onPress={closeModal}
        >
          <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />
        </Pressable>
      </View>
      <TaskForm task={task} team={team} onSuccess={onSuccess} noteId={noteId} />
    </View>
  );
}
