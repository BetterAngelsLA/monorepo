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
  const [task, setTask] = useState(purpose.value);
  const [localId, setLocalId] = useState<string | undefined>(
    purpose.id || undefined
  );
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
    debounce(async (title: string, id: string | undefined) => {
      if (!noteId) return;
      try {
        if (id && title) {
          const { data } = await updateTask({
            variables: {
              data: {
                id,
                title,
              },
            },
          });
          if (!data) {
            console.log('Error updating task', updateError);
          }
        } else if (id && !title) {
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
                title,
                noteId,
                status: TaskStatusEnum.Completed,
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
      } catch (err) {
        console.error('Error creating task:', err);
      }
    }, 500)
  ).current;

  const onChange = (e: string) => {
    if (loading) return;
    setTask(e);
    setPurposes(
      purposes.map((item, idx) =>
        idx === index ? { ...item, value: e } : item
      )
    );
    createTask(e, localId);
  };

  const onDelete = async () => {
    setTask('');
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
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  return (
    <BasicInput
      onDelete={onDelete}
      placeholder="Enter a purpose"
      mt={index !== 0 ? 'xs' : undefined}
      error={hasError && index === 0}
      value={task}
      onChangeText={onChange}
    />
  );
}
