import { useMutation } from '@apollo/client/react';
import { TaskStatusEnum, UpdateTaskInput } from '../../apollo';
import { useSnackbar } from '../../hooks';

// 1. Import Mutations
import { CreateTaskDocument } from '../TaskForm/__generated__/createTask.generated';
import { DeleteTaskDocument } from '../TaskForm/__generated__/deleteTask.generated';
import { UpdateTaskDocument } from '../TaskForm/__generated__/updateTask.generated';

import { TaskForm } from '../TaskForm';
import { TaskFormData } from '../TaskForm/TaskForm';

interface INoteTasksModalProps {
  clientProfileId?: string;
  hmisClientProfileId?: string;
  noteId?: string;
  hmisNoteId?: string;
  refetch: () => void;
  teamId?: string | null;
  task?: UpdateTaskInput;
  onSubmit?: (data: TaskFormData, existingId?: string) => void;
  onDelete?: (id: string) => void;
  closeModal: () => void;
}

export default function NoteTasksModal(props: INoteTasksModalProps) {
  const {
    clientProfileId,
    hmisClientProfileId,
    noteId,
    hmisNoteId,
    refetch,
    teamId,
    task,
    onSubmit,
    onDelete,
    closeModal,
  } = props;

  const { showSnackbar } = useSnackbar();

  const [createTask] = useMutation(CreateTaskDocument);
  const [updateTask] = useMutation(UpdateTaskDocument);
  const [deleteTask] = useMutation(DeleteTaskDocument, {
    update(cache, { data }) {
      if (data?.deleteTask?.__typename !== 'DeletedObjectType') {
        console.error(
          `[DeleteTask] failed to delete Task  __typename DeletedObjectType missing from response.`
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
      const cleanTeamId = !formData.teamId ? null : formData.teamId;

      if (task?.id) {
        await updateTask({
          variables: {
            data: {
              id: task.id,
              summary: formData.summary,
              description: formData.description,
              status: cleanStatus,
              teamId: cleanTeamId,
            },
          },
        });
      } else {
        await createTask({
          variables: {
            data: {
              summary: formData.summary || '',
              description: formData.description,
              status: cleanStatus,
              teamId: cleanTeamId ?? teamId ?? undefined,

              // FIX: Map IDs correctly based on which props are present
              clientProfile: clientProfileId ?? undefined,
              hmisClientProfile: hmisClientProfileId ?? undefined,

              note: noteId ?? undefined,
              hmisNote: hmisNoteId ?? undefined,
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
    if (!task?.id) {
      closeModal();

      return;
    }

    if (onDelete) {
      onDelete(task.id);
      closeModal();

      return;
    }

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
  };

  const initialValues: Partial<TaskFormData> = {
    summary: task?.summary || '',
    description: task?.description || '',
    status: task?.status || TaskStatusEnum.ToDo,
    teamId: task?.teamId ?? teamId ?? '',
  };

  const showDelete = !!onDelete || !!task?.id;

  return (
    <TaskForm
      initialValues={initialValues}
      onSubmit={handleSave}
      onCancel={closeModal}
      onDelete={showDelete ? handleDelete : undefined}
    />
  );
}
