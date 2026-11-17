import { useMutation } from '@apollo/client/react';
import { TaskStatusEnum, UpdateTaskInput } from '../../apollo';
import { useCreateTask, useSnackbar } from '../../hooks';

// 1. Import Mutations
import { DeleteTaskDocument } from '../TaskForm/__generated__/deleteTask.generated';
import { UpdateTaskDocument } from '../TaskForm/__generated__/updateTask.generated';

import { TaskForm } from '../TaskForm';
import { TaskFormData, TTaskFormSubmitResult } from '../TaskForm/TaskForm';

interface INoteTasksModalProps {
  clientProfileId?: string;
  hmisClientProfileId?: string;
  noteId?: string;
  hmisNoteId?: string;
  refetch: () => void;
  teamId?: string | null;
  task?: UpdateTaskInput;
  onSubmit?: (
    data: TaskFormData,
    existingId?: string,
  ) => Promise<boolean | void> | boolean | void;
  onDelete?: (id: string) => void;
  closeModal: () => void;
}

/** Map the API's field names onto the form's. */
function toTaskFormField(
  apiField: string | null | undefined,
): keyof TaskFormData | undefined {
  if (!apiField) return undefined;
  if (apiField === 'assignee') return 'assigneeId';
  if (apiField === 'team') return 'teamId';

  return apiField as keyof TaskFormData;
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

  const createTask = useCreateTask();
  const [updateTask] = useMutation(UpdateTaskDocument);
  const [deleteTask] = useMutation(DeleteTaskDocument, {
    update(cache, { data }) {
      if (data?.deleteTask?.__typename !== 'DeletedObjectType') {
        console.error(
          `[DeleteTask] failed to delete Task  __typename DeletedObjectType missing from response.`,
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

  const handleSave = async (
    formData: TaskFormData,
  ): Promise<TTaskFormSubmitResult | void> => {
    // A. Draft Mode
    if (onSubmit) {
      const saved = await onSubmit(formData, task?.id);

      // `false` means the save was refused; leave the sheet open with whatever
      // message the caller showed. Void keeps the old close-on-save behavior.
      if (saved !== false) {
        closeModal();
      }

      return undefined;
    }

    // B. Live Mode
    try {
      const cleanStatus = formData.status || undefined;
      const cleanTeamId = !formData.teamId ? null : formData.teamId;
      const cleanAssigneeId = !formData.assigneeId ? null : formData.assigneeId;

      let result;

      if (task?.id) {
        result = await updateTask({
          variables: {
            data: {
              id: task.id,
              summary: formData.summary,
              description: formData.description,
              status: cleanStatus,
              teamId: cleanTeamId,
              assigneeId: cleanAssigneeId,
            },
          },
        });
      } else {
        const created = await createTask({
          summary: formData.summary || '',
          description: formData.description,
          status: cleanStatus,
          teamId: cleanTeamId ?? teamId ?? undefined,
          assigneeId: cleanAssigneeId,

          // FIX: Map IDs correctly based on which props are present
          clientProfile: clientProfileId ?? undefined,
          hmisClientProfile: hmisClientProfileId ?? undefined,

          note: noteId ?? undefined,
          hmisNote: hmisNoteId ?? undefined,
        });

        if (!created.ok) {
          showSnackbar({ message: created.message, type: 'error' });

          const refusal = created.result?.data?.createTask;

          if (refusal?.__typename === 'OperationInfo') {
            return {
              field: toTaskFormField(refusal.messages[0]?.field),
              message: created.message,
            };
          }

          return;
        }

        result = created.result;
      }
      // A rejected value (e.g. an assignee who is not in the task's org)
      // comes back as OperationInfo rather than an exception; without this the
      // sheet closed as if the save had worked.
      const payload =
        result.data && 'updateTask' in result.data
          ? result.data.updateTask
          : result.data && 'createTask' in result.data
            ? result.data.createTask
            : undefined;

      if (payload?.__typename === 'OperationInfo') {
        const first = payload.messages[0];

        showSnackbar({
          message: first?.message ?? 'Failed to save task.',
          type: 'error',
        });

        return {
          field: toTaskFormField(first?.field),
          message: first?.message ?? '',
        };
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
    assigneeId: task?.assigneeId ?? '',
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
