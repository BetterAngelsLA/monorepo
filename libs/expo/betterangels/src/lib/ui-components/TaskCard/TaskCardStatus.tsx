import { Colors } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { TaskStatusEnum, TaskType } from '../../apollo';
import { useSnackbar } from '../../hooks';
import { enumDisplayTaskStatus } from '../../static';
import SelectStatus from '../SelectStatus';
import { useUpdateTaskMutation } from '../TaskForm/__generated__/updateTask.generated';

const OPTIONS = [
  {
    value: TaskStatusEnum.ToDo,
    displayValue: enumDisplayTaskStatus[TaskStatusEnum.ToDo],
    bg: Colors.NEUTRAL_DARK,
    text: Colors.WHITE,
  },
  {
    value: TaskStatusEnum.InProgress,
    displayValue: enumDisplayTaskStatus[TaskStatusEnum.InProgress],
    bg: Colors.WARNING_LIGHT,
    text: Colors.PRIMARY_EXTRA_DARK,
  },
  {
    value: TaskStatusEnum.Completed,
    displayValue: enumDisplayTaskStatus[TaskStatusEnum.Completed],
    bg: Colors.SUCCESS,
    text: Colors.WHITE,
  },
];

type TaskCardStatusProps = {
  id: TaskType['id'];
  status: TaskType['status'];
};

export default function TaskCardStatus(props: TaskCardStatusProps) {
  const { id, status } = props;
  const [updateTaskMutation] = useUpdateTaskMutation();
  const [disabled, setDisabled] = useState(false);
  const { showSnackbar } = useSnackbar();
  const [value, setValue] = useState<TaskStatusEnum>(
    status || TaskStatusEnum.ToDo
  );

  const onUpdateTask = async (newTask: TaskStatusEnum) => {
    try {
      setDisabled(true);

      const response = await updateTaskMutation({
        variables: {
          data: {
            id,
            status: newTask,
          },
        },
        errorPolicy: 'all',
      });

      const updatedTask = response.data?.updateTask;

      if (!updatedTask) {
        throw new Error('mutation failed');
      }
    } catch (error) {
      console.error('Task status update error:', error);

      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    } finally {
      setValue(newTask);
      setDisabled(false);
    }
  };

  return (
    <SelectStatus
      disabled={disabled}
      onChange={(e) => onUpdateTask(e as TaskStatusEnum)}
      options={OPTIONS}
      value={value}
    />
  );
}
