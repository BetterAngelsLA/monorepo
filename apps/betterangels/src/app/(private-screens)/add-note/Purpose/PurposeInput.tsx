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
} from '@monorepo/expo/betterangels';
import { BasicInput } from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useRef, useState } from 'react';

interface IPurposeProps {
  index: number;
  setPurposes: (purposes: { value: string; id: string | undefined }[]) => void;
  purposes: { value: string; id: string | undefined }[];
  purpose: { value: string; id: string | undefined };
  hasError: boolean;
  noteId: string | undefined;
}

export default function PurposeInput(props: IPurposeProps) {
  const { index, hasError, purpose, setPurposes, noteId, purposes } = props;
  const [value, setValue] = useState(purpose.value);
  const [localId, setLocalId] = useState<string | undefined>(undefined);
  const [createNoteTask, { error, loading }] = useMutation<
    CreateNoteTaskMutation,
    CreateNoteTaskMutationVariables
  >(CREATE_NOTE_TASK);
  const [updateTask, { error: updateError }] = useMutation<
    UpdateTaskMutation,
    UpdateTaskMutationVariables
  >(UPDATE_TASK);
  const [deleteTask, { error: deleteError }] = useMutation<
    DeleteTaskMutation,
    DeleteTaskMutationVariables
  >(DELETE_TASK);

  const createTask = useRef(
    debounce(async (e: string, id: string | undefined) => {
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
          if (!data) {
            console.log('Error updating task', updateError);
          }
        } else if (id && !e) {
          const { data } = await deleteTask({
            variables: { id },
          });
          setLocalId(undefined);
          if (!data) {
            console.log('Error deleting task', deleteError);
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
          if (!data) {
            console.log('Error creating task', error);
            return;
          }
          if ('id' in data.createNoteTask) {
            setLocalId(data.createNoteTask.id);
          }
        }
      } catch (error) {
        console.error('Error creating task:', error);
      }
    }, 500)
  ).current;

  const onChange = (e: string) => {
    if (loading) return;
    setValue(e);
    setPurposes(
      purposes.map((item, idx) =>
        idx === index ? { ...item, value: e } : item
      )
    );
    createTask(e, localId);
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
      if (localId) {
        const { data } = await deleteTask({
          variables: { id: localId },
        });
        setLocalId(undefined);

        if (!data) {
          console.log('Error deleting task', deleteError);
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

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
