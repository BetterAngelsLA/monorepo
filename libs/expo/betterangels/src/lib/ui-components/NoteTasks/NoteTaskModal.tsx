import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useModalScreen } from '../../providers';

// Ensure this path is correct relative to NoteTasksModal.tsx
import { TaskForm, TaskFormData } from '../TaskForm/TaskForm';

interface INoteTasksModalProps {
  initialValues?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onDelete?: () => void;
}

export default function NoteTasksModal(props: INoteTasksModalProps) {
  const { initialValues, onSubmit, onDelete } = props;
  const { closeModalScreen } = useModalScreen();
  const { top: topInset } = useSafeAreaInsets();

  return (
    <View
      style={{ flex: 1, backgroundColor: Colors.WHITE, paddingTop: topInset }}
    >
      <View
        style={{
          alignItems: 'flex-end',
          paddingHorizontal: 24,
          marginBottom: 4,
        }}
      >
        <IconButton
          onPress={closeModalScreen}
          variant="transparent"
          accessibilityLabel="Close modal"
          accessibilityHint="Closes the task modal"
        >
          <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />
        </IconButton>
      </View>

      <TaskForm
        initialValues={initialValues}
        onSubmit={async (data) => {
          await onSubmit(data);
          closeModalScreen();
        }}
        onDelete={
          onDelete
            ? () => {
                onDelete();
                closeModalScreen();
              }
            : undefined
        }
        onCancel={closeModalScreen}
      />
    </View>
  );
}
