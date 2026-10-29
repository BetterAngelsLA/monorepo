import { useMutation } from '@apollo/client/react';
import { EditButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { TaskStatusEnum } from '../../apollo';
import { useSnackbar } from '../../hooks';
import { useModalScreen } from '../../providers';
import { TaskForm } from '../../ui-components';
import {
  TaskFormData,
  TTaskFormSubmitResult,
} from '../../ui-components/TaskForm/TaskForm';
import { DeleteTaskDocument } from '../../ui-components/TaskForm/__generated__/deleteTask.generated';
import { UpdateTaskDocument } from '../../ui-components/TaskForm/__generated__/updateTask.generated';
import { TaskQuery } from './__generated__/Task.generated';

type TTaskHeaderProps = {
  task: TaskQuery['task'];
  id: string;
  arrivedFrom?: string;
};

export default function TaskHeader(props: TTaskHeaderProps) {
  const { task, id, arrivedFrom } = props;

  const { showSnackbar } = useSnackbar();
  const { showModalScreen } = useModalScreen();

  const [updateTask] = useMutation(UpdateTaskDocument, {
    update(cache, { data }) {
      const payload = data?.updateTask;
      if (!payload || payload.__typename !== 'TaskType') return;

      const entityId = cache.identify({
        __typename: 'TaskType',
        id: payload.id,
      });
      if (entityId) {
        cache.modify({
          id: entityId,
          fields: {
            summary: () => payload.summary,
            description: () => payload.description,
            status: () => payload.status,
            team: () => payload.team,
            updatedAt: () => payload.updatedAt,
          },
        });
      }
    },
  });

  const [deleteTask] = useMutation(DeleteTaskDocument, {
    update(cache, { data }) {
      if (data?.deleteTask?.__typename !== 'DeletedObjectType') {
        console.error(
          `[DeleteTask] failed to delete Task __typename DeletedObjectType missing from response.`,
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

  /** The API speaks model field names; the form speaks form field names. */
  const API_FIELD_TO_FORM: Record<string, keyof TaskFormData> = {
    assignee: 'assigneeId',
    team: 'teamId',
    summary: 'summary',
    description: 'description',
    status: 'status',
  };

  function toSubmitResult(
    messages: { field?: string | null; message: string }[],
  ): TTaskFormSubmitResult | void {
    const first = messages[0];

    if (!first) return;

    return {
      field: first.field ? API_FIELD_TO_FORM[first.field] : undefined,
      message: first.message,
    };
  }

  const onSubmit = async (
    task: TaskFormData,
    closeForm: () => void,
  ): Promise<TTaskFormSubmitResult | void> => {
    if (!id) return;

    try {
      const result = await updateTask({
        variables: {
          data: {
            id,
            summary: task.summary ?? '',
            description: task.description,
            status: task.status,
            teamId: task.teamId ?? undefined,
            assigneeId: task.assigneeId || null,
          },
        },
      });

      const payload = result.data?.updateTask;

      if (payload?.__typename === 'OperationInfo') {
        // A validation error (an assignee outside the task's organization, for
        // one) arrives as data, not as a thrown error. Closing the form here
        // would look like the save worked.
        showSnackbar({
          message: payload.messages[0]?.message ?? 'Could not update the task.',
          type: 'error',
        });

        return toSubmitResult(
          payload.messages as { field?: string | null; message: string }[],
        );
      }

      closeForm();
    } catch (e) {
      showSnackbar({
        message: 'Error updating the task.',
        type: 'error',
      });
      console.error(e);
    }
  };

  const onDelete = async (id: string, closeForm: () => void) => {
    try {
      await deleteTask({
        variables: { id },
      });

      showSnackbar({ message: 'Task deleted', type: 'success' });
      closeForm();
      arrivedFrom ? router.replace(arrivedFrom) : router.back();
    } catch (err) {
      console.error(err);
      showSnackbar({ message: 'Failed to delete task', type: 'error' });
    }
  };

  function openTaskForm() {
    showModalScreen({
      presentation: 'fullScreenModal',
      renderContent: ({ close }) => (
        <TaskForm
          organizationId={task.organization?.id ?? null}
          selectedAssignee={
            task.assignee
              ? {
                  id: task.assignee.id,
                  firstName: task.assignee.firstName,
                  lastName: task.assignee.lastName,
                }
              : null
          }
          initialValues={{
            summary: task.summary || '',
            // `null`, not `undefined`: every field in the task form schema is
            // `.nullable()` but not optional, so an `undefined` team makes
            // `zodResolver` reject the submit on a team-less task.
            teamId: task.team?.id ?? null,
            assigneeId: task.assignee?.id ?? '',
            description: task.description || '',
            status: task.status || TaskStatusEnum.ToDo,
          }}
          onDelete={() => onDelete(id, close)}
          onSubmit={(task) => onSubmit(task, close)}
          onCancel={close}
        />
      ),
      title: 'Follow-Up Task',
    });
  }
  return (
    <View style={styles.container}>
      <TextRegular style={{ flex: 1 }}>{task.summary}</TextRegular>
      <EditButton iconSize="md" onClick={openTaskForm} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
