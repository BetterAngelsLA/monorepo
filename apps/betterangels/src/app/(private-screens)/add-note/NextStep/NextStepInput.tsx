import {
  TaskStatusEnum,
  TaskTypeEnum,
  useCreateNoteTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
} from '@monorepo/expo/betterangels';
import { Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  DatePicker,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useRef, useState } from 'react';
import { View } from 'react-native';

type TNextStep = {
  id?: string;
  action: string;
  time?: string | undefined;
  date?: string | undefined;
};

interface INextStepProps {
  index: number;
  setNextSteps: (nextSteps: TNextStep[]) => void;
  nextSteps: TNextStep[];
  nextStep: {
    id?: string;
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
  const [id, setId] = useState<string | undefined>(nextStep.id || undefined);
  const [createNoteTask, { error, loading }] = useCreateNoteTaskMutation();
  const [updateTask, { error: updateError }] = useUpdateTaskMutation();
  const [deleteTask, { error: deleteError }] = useDeleteTaskMutation();

  const createTask = useRef(
    debounce(
      async (
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
          if (id && obj.action) {
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
          } else if (id && !obj.action) {
            const { data } = await deleteTask({
              variables: { id },
            });
            setId(undefined);
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
              setId(data.createNoteTask.id);
            }
          }
        } catch (err) {
          console.error('Error creating task:', err);
        }
      },
      500
    )
  ).current;

  const onChange = (e: string, key: 'action' | 'date' | 'time') => {
    if (loading && !id) return;
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
    createTask(taskObj, id);
  };

  const onDelete = async () => {
    setTask({ action: '', time: '', date: '' });
    const newNextSteps = nextSteps.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          id: undefined,
          action: '',
        };
      }
      return item;
    });
    setNextSteps(newNextSteps);
    try {
      if (id) {
        await deleteTask({
          variables: { id },
        });
        setId(undefined);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  return (
    <View style={{ gap: Spacings.xs, marginBottom: Spacings.xs }} key={index}>
      {nextSteps.length > 1 && <TextBold>Action {index + 1}</TextBold>}
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
