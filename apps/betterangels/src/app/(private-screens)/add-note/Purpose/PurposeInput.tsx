import { useMutation } from '@apollo/client';
import {
  CREATE_NOTE_TASK,
  CreateNoteTaskMutation,
  CreateNoteTaskMutationVariables,
  DELETE_TASK,
  DeleteTaskMutation,
  DeleteTaskMutationVariables,
  TaskStatusEnum,
  TaskTypeEnum,
  UPDATE_TASK,
  UpdateTaskMutation,
  UpdateTaskMutationVariables,
  debounce,
} from '@monorepo/expo/betterangels';
import { BasicInput } from '@monorepo/expo/shared/ui-components';
import { useCallback, useState } from 'react';

interface IPurposeProps {
  index: number;
  setPurposes: (e: { value: string; id: string | undefined }[]) => void;
  purposes: { value: string; id: string | undefined }[];
  purpose: { value: string; id: string | undefined };
  hasError: boolean;
  noteId: string | undefined;
}

export default function PurposeInput(props: IPurposeProps) {
  const { index, hasError, purpose, setPurposes, noteId, purposes } = props;
  const [value, setValue] = useState(purpose.value);
  const [createNoteTask] = useMutation<
    CreateNoteTaskMutation,
    CreateNoteTaskMutationVariables
  >(CREATE_NOTE_TASK);
  const [updateTask] = useMutation<
    UpdateTaskMutation,
    UpdateTaskMutationVariables
  >(UPDATE_TASK);
  const [deleteTask] = useMutation<
    DeleteTaskMutation,
    DeleteTaskMutationVariables
  >(DELETE_TASK);

  const createTask = useCallback(
    async (e: string, id: string | undefined) => {
      if (!noteId) return;
      try {
        if (id && e) {
          const { data } = await updateTask({
            variables: {
              data: {
                id,
                title: e,
              },
            },
          });
          if (data?.updateTask.__typename === 'TaskType') {
            const updatedPurposes = purposes.map((item) =>
              item.id === id ? { value: e, id } : item
            );
            setPurposes(updatedPurposes);
          } else if (data?.updateTask.__typename === 'OperationInfo') {
            console.log(data.updateTask.messages);
          }
        } else if (id && !e) {
          const { data } = await deleteTask({
            variables: { id },
          });
          const newPurposes = purposes.map((item, idx) => {
            if (idx === index) {
              return {
                id: undefined,
                value: '',
              };
            }
            return item;
          });
          setPurposes(newPurposes);
          if (data?.deleteTask.__typename === 'OperationInfo') {
            console.log(data.deleteTask.messages);
          }
        } else {
          const { data } = await createNoteTask({
            variables: {
              data: {
                title: e,
                noteId,
                status: TaskStatusEnum.ToDo,
                taskType: TaskTypeEnum.Purpose,
              },
            },
          });
          if (data?.createNoteTask.__typename === 'TaskType') {
            const createNoteTaskId = data?.createNoteTask.id;
            if (createNoteTaskId) {
              const newPurposes = purposes.filter((item, idx) => idx !== index);
              console.log(purposes);
              console.log(newPurposes);
              setPurposes([...newPurposes, { value: e, id: createNoteTaskId }]);
            }
          } else if (data?.createNoteTask.__typename === 'OperationInfo') {
            console.log(data.createNoteTask.messages);
          }
        }
      } catch (error) {
        console.error('Error creating task:', error);
      }
    },
    [createNoteTask, noteId, purposes, index]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCreateTask = useCallback(debounce(createTask, 500), [
    createTask,
  ]);

  const onChange = (e: string) => {
    setValue(e);
    debouncedCreateTask(e, purpose.id);
  };

  const onDelete = async () => {
    setValue('');
    const newPurposes = purposes.map((item, idx) => {
      if (idx === index) {
        return {
          id: undefined,
          value: '',
        };
      }
      return item;
    });
    setPurposes(newPurposes);
    try {
      if (purpose.id) {
        await deleteTask({
          variables: { id: purpose.id },
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  console.log(hasError);
  return (
    <BasicInput
      onDelete={onDelete}
      placeholder="Enter a purpose"
      mt={index !== 0 ? 'xs' : undefined}
      error={hasError && index === 0}
      value={value}
      onChangeText={onChange}
    />
  );
}
