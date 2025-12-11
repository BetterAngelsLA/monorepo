import { useMutation } from '@apollo/client/react';
import { EditButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { TaskStatusEnum } from '../../apollo';
import { useSnackbar } from '../../hooks';
import { useModalScreen } from '../../providers';
import { TaskForm } from '../../ui-components';
import { DeleteTaskDocument } from '../../ui-components/TaskForm/__generated__/deleteTask.generated';
import { UpdateTaskDocument } from '../../ui-components/TaskForm/__generated__/updateTask.generated';
import { TaskFormData } from '../../ui-components/TaskForm/TaskForm';
import { TaskQuery } from './__generated__/Task.generated';

type TTaskHeaderProps = {
  task: TaskQuery['task'];
  id: string;
};

export default function TaskHeader(props: TTaskHeaderProps) {
  const { task, id } = props;

  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  const [updateTask] = useMutation(UpdateTaskDocument);

  const [deleteTask] = useMutation(DeleteTaskDocument, {
    update(cache, { data }) {
      if (data?.deleteTask?.__typename !== 'DeletedObjectType') {
        console.error(
          `[DeleteTask] failed to delete Task __typename DeletedObjectType missing from response.`
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

  const { showModalScreen, closeModalScreen } = useModalScreen();

  const onSubmit = async (task: TaskFormData) => {
    if (!id) return;

    try {
      const result = await updateTask({
        variables: {
          data: {
            id,
            summary: task.summary!,
            description: task.description,
            status: task.status,
            team: task.team || null,
          },
        },
      });

      if (result.data?.updateTask.__typename === 'OperationInfo') {
        console.log(result.data.updateTask.messages);
      }

      closeModalScreen();
    } catch (e) {
      showSnackbar({
        message: 'Error updating the task.',
        type: 'error',
      });
      console.error(e);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteTask({
        variables: { id },
      });
      showSnackbar({ message: 'Task deleted', type: 'success' });
      router.back();
      closeModalScreen();
    } catch (err) {
      showSnackbar({ message: 'Failed to delete task', type: 'error' });
    }
  };

  function openTaskForm() {
    showModalScreen({
      presentation: 'modal',
      content: (
        <TaskForm
          initialValues={{
            summary: task.summary || '',
            team: task.team || '',
            description: task.description || '',
            status: task.status || TaskStatusEnum.ToDo,
          }}
          onDelete={() => onDelete(id)}
          onCancel={() => {
            closeModalScreen();
          }}
          onSubmit={onSubmit}
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
