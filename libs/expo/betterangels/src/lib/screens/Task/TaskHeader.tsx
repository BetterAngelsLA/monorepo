import { useMutation } from '@apollo/client/react';
import { EditButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { TaskStatusEnum } from '../../apollo';
import { useSnackbar } from '../../hooks';
import { useModalScreen } from '../../providers';
import { TaskForm } from '../../ui-components';
import { TaskFormData } from '../../ui-components/TaskForm/TaskForm';
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

  const onSubmit = async (task: TaskFormData, closeForm: () => void) => {
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
      showSnackbar({ message: 'Failed to delete task', type: 'error' });
    }
  };

  function openTaskForm() {
    showModalScreen({
      presentation: 'modal',
      renderContent: ({ close }) => (
        <TaskForm
          initialValues={{
            summary: task.summary || '',
            team: task.team || null,
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
