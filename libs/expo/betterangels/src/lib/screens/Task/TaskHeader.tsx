import { useMutation } from '@apollo/client/react';
import { EditButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { TaskStatusEnum } from '../../apollo';
import { useSnackbar } from '../../hooks';
import { useModalScreen } from '../../providers';
import { TaskForm } from '../../ui-components';
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

  const [updateTask] = useMutation(UpdateTaskDocument);

  const { showModalScreen, closeModalScreen } = useModalScreen();

  const onSubmit = async (task: TaskFormData) => {
    console.log(id);
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
        message: 'Error uploading profile photo.',
        type: 'error',
      });
      console.error(e);
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
