import { useApolloClient } from '@apollo/client';
import { Colors } from '@monorepo/expo/shared/static';
import { useEffect, useState } from 'react';
import { TaskStatusEnum, TaskType } from '../../apollo';
import { useSnackbar } from '../../hooks';
import { enumDisplayTaskStatus } from '../../static';
import SelectStatus, { Option } from '../SelectStatus';
import { useUpdateTaskStatusMutation } from './__generated__/updateTaskStatus.generated';

const OPTIONS: Option<TaskStatusEnum>[] = [
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

type TaskStatusBtnProps = {
  id: TaskType['id'];
  status: TaskType['status'];
};

export function TaskStatusBtn({ id, status }: TaskStatusBtnProps) {
  const [updateTaskMutation] = useUpdateTaskStatusMutation();
  const [disabled, setDisabled] = useState(false);
  const { showSnackbar } = useSnackbar();
  const client = useApolloClient();

  const [value, setValue] = useState<TaskStatusEnum>(
    status || TaskStatusEnum.ToDo
  );

  useEffect(() => {
    if (status != null) setValue(status);
  }, [id, status]);

  const onUpdateTask = async (newStatus: TaskStatusEnum) => {
    try {
      setDisabled(true);

      const response = await updateTaskMutation({
        variables: {
          data: { id, status: newStatus },
        },
        errorPolicy: 'all',
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
                status: () => payload.status,
                updatedAt: () => payload.updatedAt ?? new Date().toISOString(),
              },
            });
          }
        },
      });

      if (!response.data?.updateTask) throw new Error('mutation failed');
      setValue(newStatus);
    } catch (error) {
      console.error('Task status update error:', error);
      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });

      const cacheId = client.cache.identify({ __typename: 'Task', id });
      client.cache.modify({
        id: cacheId,
        fields: { status: () => status },
      });
    } finally {
      setDisabled(false);
    }
  };

  return (
    <SelectStatus<TaskStatusEnum>
      disabled={disabled}
      onChange={onUpdateTask} // (next: TaskStatusEnum) => Promise<void> OK
      options={OPTIONS}
      value={value}
    />
  );
}
