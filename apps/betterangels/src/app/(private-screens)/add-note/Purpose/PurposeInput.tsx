import {
  TaskStatusEnum,
  TaskTypeEnum,
  useCreateNoteTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
} from '@monorepo/expo/betterangels';
import { BasicInput } from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useRef, useState } from 'react';

interface IPurposeProps {
  index: number;
  setPurposes: (purposes: { value: string; id: string | undefined }[]) => void;
  purposes: { value: string; id: string | undefined }[];
  purpose: { value: string; id: string | undefined };
  noteId: string | undefined;
}

export default function PurposeInput(props: IPurposeProps) {
  const { index, purpose, setPurposes, noteId, purposes } = props;
  const [task, setTask] = useState(purpose.value);
  const [localId, setLocalId] = useState<string | undefined>(
    purpose.id || undefined
  );
  const [createNoteTask, { error, loading }] = useCreateNoteTaskMutation();
  const [updateTask, { error: updateError }] = useUpdateTaskMutation();
  const [deleteTask, { error: deleteError }] = useDeleteTaskMutation();

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
      value={task}
      onChangeText={onChange}
    />
  );
}
