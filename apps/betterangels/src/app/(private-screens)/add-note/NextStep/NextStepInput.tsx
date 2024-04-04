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
import { Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  DatePicker,
  H3,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

interface INextStepProps {
  index: number;
  setNextSteps: (
    e: {
      action: string;
      time?: string | undefined;
      date?: string | undefined;
    }[]
  ) => void;
  nextSteps: {
    action: string;
    time?: string | undefined;
    date?: string | undefined;
  }[];
  nextStep: {
    action: string;
    time?: string | undefined;
    date?: string | undefined;
  };
  noteId: string | undefined;
}

export default function NextStepInput(props: INextStepProps) {
  const { index, nextStep, setNextSteps, noteId, nextSteps } = props;
  const [task, setTask] = useState({
    action: nextStep.action,
    time: nextStep.time,
    date: nextStep.date,
  });
  const [localId, setLocalId] = useState<string | undefined>(undefined);
  const [createNoteTask, { error }] = useMutation<
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

  const createTask = async (
    obj: { action: string; date?: string; time?: string },
    id: string | undefined
  ) => {
    if (!noteId) return;
    // TODO: for future design
    //   let combinedDateTime;
    //   let isoDateTime = '';

    //   if (obj.date) {
    //     const parsedDate = parse(obj.date, 'dd/MM/yyyy', new Date());
    //     combinedDateTime = parsedDate;

    //     if (obj.time) {
    //       const [hours, minutes] = obj.time.split(':').map(Number);
    //       combinedDateTime = setMinutes(setHours(parsedDate, hours), minutes);
    //     }

    //     isoDateTime = combinedDateTime.toISOString();
    //   }
    try {
      if (id && obj.action.trim()) {
        const { data } = await updateTask({
          variables: {
            data: {
              id,
              title: obj.action,
            },
          },
        });
        if (!data) {
          console.log('Error updating task', updateError);
        }
      } else if (id && !obj.action.trim()) {
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
              title: obj.action,
              noteId,
              status: TaskStatusEnum.ToDo,
              taskType: TaskTypeEnum.NextStep,
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
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCreateTask = useCallback(debounce(createTask, 500), [
    noteId,
    updateTask,
    deleteTask,
    createNoteTask,
  ]);

  const onChange = (e: string, key: 'action' | 'date' | 'time') => {
    setTask({ ...task, [key]: e });
    setNextSteps(
      nextSteps.map((item, idx) =>
        idx === index ? { ...item, [key]: e } : item
      )
    );

    if (key !== 'action' && !task.action) return;
    const taskObj = {
      ...task,
      [key]: e,
    };
    debouncedCreateTask(taskObj, localId);
  };

  const onDelete = async () => {
    setTask({ action: '', time: '', date: '' });
    const newNextSteps = nextSteps.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          id: undefined,
          value: '',
        };
      }
      return item;
    });
    setNextSteps(newNextSteps);
    try {
      if (localId) {
        await deleteTask({
          variables: { id: localId },
        });
        setLocalId(undefined);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <View style={{ gap: Spacings.xs, marginBottom: Spacings.xs }} key={index}>
      {nextSteps.length > 1 && <H3>Action {index + 1}</H3>}
      <BasicInput
        label="Action Item"
        onDelete={onDelete}
        mt={index !== 0 ? 'xs' : undefined}
        value={task.action}
        onChangeText={(e) => onChange(e, 'action')}
      />
      <DatePicker
        onSave={(e) => onChange(e, 'date')}
        disabled
        label="Date (optional)"
        mode="date"
        placeholder="MM/DD/YYYY"
        format="MM/dd/yyyy"
      />
      <DatePicker
        disabled
        onSave={(e) => onChange(e, 'time')}
        label="Time (optional)"
        format="HH:mm"
        placeholder="HH:MM"
        mode="time"
      />
    </View>
  );
}
