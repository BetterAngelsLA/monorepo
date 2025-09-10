import { useApolloClient } from '@apollo/client';
import { Colors } from '@monorepo/expo/shared/static';
import { useEffect, useState } from 'react';
import { TaskStatusEnum, TaskType } from '../../apollo';
import { useSnackbar } from '../../hooks';
import { enumDisplayTaskStatus } from '../../static';
import SelectStatus from '../SelectStatus';
import { useUpdateTaskStatusMutation } from './__generated__/updateTask.generated';

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

  const [updateTaskMutation] = useUpdateTaskStatusMutation();
  const [disabled, setDisabled] = useState(false);
  const { showSnackbar } = useSnackbar();
  const client = useApolloClient();

  const [value, setValue] = useState<TaskStatusEnum>(
    status || TaskStatusEnum.ToDo
  );

  useEffect(() => {
    if (status && status !== value) {
      setValue(status);
    }
  }, [id, status]);

  const onUpdateTask = async (newStatus: TaskStatusEnum) => {
    try {
      setDisabled(true);

      const response = await updateTaskMutation({
        variables: {
          data: {
            id,
            status: newStatus,
          },
        },
        errorPolicy: 'all',

        update(cache, { data }) {
          const payload = data?.updateTask;
          if (!payload) return;

          if (payload.__typename !== 'TaskType') {
            return;
          }

          const entityId = cache.identify({
            __typename: 'TaskType',
            id: payload.id,
          });
          if (entityId) {
            cache.modify({
              id: entityId,
              fields: {
                status: () => payload.status,
                updatedAt: () => payload.updatedAt ?? new Date().toISOString(),
              },
            });
          }
        },
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

      const cacheId = client.cache.identify({ __typename: 'Task', id });
      client.cache.modify({
        id: cacheId,
        fields: {
          status: () => status,
        },
      });
    } finally {
      setValue(newStatus);
      setDisabled(false);
    }
  };

  return (
    <SelectStatus
      disabled={disabled}
      onChange={(status) => onUpdateTask(status as TaskStatusEnum)}
      options={OPTIONS}
      value={value}
    />
  );
}
