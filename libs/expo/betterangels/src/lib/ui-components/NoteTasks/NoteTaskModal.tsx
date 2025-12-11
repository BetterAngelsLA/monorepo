import { useMutation } from '@apollo/client/react';
import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SelahTeamEnum, TaskStatusEnum, UpdateTaskInput } from '../../apollo';
import { useSnackbar } from '../../hooks';
import { useModalScreen } from '../../providers';

// 1. Import Mutations
import { CreateTaskDocument } from '../TaskForm/__generated__/createTask.generated';
import { DeleteTaskDocument } from '../TaskForm/__generated__/deleteTask.generated';
import { UpdateTaskDocument } from '../TaskForm/__generated__/updateTask.generated';

import { TaskForm } from '../TaskForm';
import { TaskFormData } from '../TaskForm/TaskForm';

interface INoteTasksModalProps {
  clientProfileId?: string;
  hmisClientProfileId?: string; // <--- Ensure this is used
  noteId?: string;
  hmisNoteId?: string;
  refetch: () => void;
  team?: SelahTeamEnum | null;
  task?: UpdateTaskInput;
  onSubmit?: (data: TaskFormData, existingId?: string) => void;
  onDelete?: (id: string) => void;
}

export default function NoteTasksModal(props: INoteTasksModalProps) {
  const {
    clientProfileId,
    hmisClientProfileId,
    noteId,
    hmisNoteId,
    refetch,
    team,
    task,
    onSubmit,
    onDelete,
  } = props;

  const { closeModalScreen } = useModalScreen();
  const { showSnackbar } = useSnackbar();
  const { top: topInset } = useSafeAreaInsets();

  const [createTask] = useMutation(CreateTaskDocument);
  const [updateTask] = useMutation(UpdateTaskDocument);
  const [deleteTask] = useMutation(DeleteTaskDocument, {
    update(cache, { data }) {
      if (data?.deleteTask?.__typename !== 'DeletedObjectType') {
        console.error(
          `[DeleteTask] failed to delete Task id [${id}]. __typename DeletedObjectType missing from response.`
        );

        return;
      }

      // Cache store ID is a string, so must convert
      const deletedId = String(data.deleteTask.id);

      cache.evict({
        // Note `__typename: 'TaskType'` is not in the response payload. It uses a generic `DeletedObjectType`.
        id: cache.identify({ __typename: 'TaskType', id: deletedId }),
      });

      // clean up
      cache.gc();
    },
  });

  const closeModal = () => {
    closeModalScreen();
  };

  const handleSave = async (formData: TaskFormData) => {
    // A. Draft Mode
    if (onSubmit) {
      onSubmit(formData, task?.id);
      closeModal();
      return;
    }

    // B. Live Mode
    try {
      const cleanStatus = formData.status || undefined;
      const cleanTeam = formData.team === '' ? null : formData.team;

      if (task?.id) {
        await updateTask({
          variables: {
            data: {
              id: task.id,
              summary: formData.summary,
              description: formData.description,
              status: cleanStatus,
              team: cleanTeam,
            },
          },
        });
      } else {
        await createTask({
          variables: {
            data: {
              summary: formData.summary,
              description: formData.description,
              status: cleanStatus,
              team: cleanTeam || team || null,

              // FIX: Map IDs correctly based on which props are present
              clientProfile: clientProfileId || null,
              hmisClientProfile: hmisClientProfileId || null, // <--- Added this

              note: noteId || null,
              hmisNote: hmisNoteId || null,
            },
          },
        });
      }
      refetch();
      closeModal();
    } catch (error) {
      console.error('Task mutation error:', error);
      showSnackbar({ message: 'Failed to save task.', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (onDelete && task?.id) {
      onDelete(task.id);
      closeModal();
      return;
    }

    if (task?.id) {
      try {
        await deleteTask({
          variables: {
            id: task.id,
          },
        });
        refetch();
        closeModal();
      } catch (error) {
        console.error('Task delete error:', error);
        showSnackbar({ message: 'Failed to delete task.', type: 'error' });
      }
    } else {
      closeModal();
    }
  };

  const initialValues: Partial<TaskFormData> = {
    summary: task?.summary || '',
    description: task?.description || '',
    status: task?.status || TaskStatusEnum.ToDo,
    team: (task?.team as SelahTeamEnum) || team || '',
  };

  const showDelete = !!onDelete || !!task?.id;

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
        initialValues={initialValues}
        onSubmit={handleSave}
        onCancel={closeModal}
        onDelete={showDelete ? handleDelete : undefined}
      />
    </View>
  );
}
