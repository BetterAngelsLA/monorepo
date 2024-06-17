import { useUpdateTaskMutation } from '@monorepo/expo/betterangels';
import { Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  DatePicker,
  FieldCard,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { format, parse, setHours, setMinutes } from 'date-fns';
import { RefObject, useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

interface IDueByProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  taskId: string | undefined;
  dueBy: Date;
  scrollRef: RefObject<ScrollView>;
}

type TTask = {
  date: string;
  time: string;
};

const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

export default function DueBy(props: IDueByProps) {
  const { expanded, setExpanded, taskId, dueBy, scrollRef } = props;
  const [task, setTask] = useState<TTask>({
    date: format(dueBy, 'MM/dd/yyyy'),
    time: format(dueBy, 'HH:mm'),
  });

  const [updateTask, { error: updateError, loading }] = useUpdateTaskMutation();

  const [error, setError] = useState({
    date: false,
    time: false,
  });
  const taskRef = useRef(task);
  const isDueBy = expanded === 'DueBy';

  const updateTaskFunction = useRef(
    debounce(async (key: 'time' | 'date', value: string) => {
      if (!taskId || !value) return;
      const currentTask = taskRef.current;
      const dateValue = key === 'date' ? value : currentTask.date;
      const timeValue = key === 'time' ? value : currentTask.time;
      let dueBy = value;

      if (key === 'time' || key === 'date') {
        const parsedDate = parse(dateValue, 'MM/dd/yyyy', new Date());
        const [hours, minutes] = timeValue.split(':').map(Number);
        const combinedDateTime = setMinutes(
          setHours(parsedDate, hours),
          minutes
        );

        dueBy = new Date(combinedDateTime).toISOString();
      }

      try {
        const { data } = await updateTask({
          variables: {
            data: {
              id: taskId,
              dueBy,
            },
          },
        });
        if (!data) {
          console.log('Error updating task', updateError);
        }
      } catch (err) {
        console.log(err);
      }
    }, 500)
  ).current;

  const onChange = (key: 'date' | 'time', value: string) => {
    if (loading) return;
    if (!value) {
      setError({ ...error, [key]: true });
    }
    if (error[key]) {
      setError({ ...error, [key]: false });
    }
    setTask({ ...task, [key]: value });
    updateTaskFunction(key, value);
  };

  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isDueBy ? null : 'DueBy');
      }}
      error={
        (error.date || error.time) && !isDueBy
          ? `Please enter a due date and time for this task`
          : undefined
      }
      actionName={
        !dueBy ? (
          <TextMedium>Add Due Date</TextMedium>
        ) : (
          <TextMedium>
            {task.date} {task.time}
          </TextMedium>
        )
      }
      title="Due Date"
    >
      <View style={{ marginBottom: Spacings.xs }}>
        <View
          style={{
            height: isDueBy ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          <DatePicker
            error={!!error.date}
            disabled
            initialDate={dueBy}
            pattern={Regex.date}
            maxDate={endOfDay}
            mode="date"
            format="MM/dd/yyyy"
            placeholder="MM/DD/YYYY"
            mb="xs"
            onSave={(date) => onChange('date', date)}
          />
          <DatePicker
            error={!!error.time}
            disabled
            maxDate={endOfDay}
            initialDate={dueBy}
            mode="time"
            format="HH:mm"
            placeholder="HH:MM"
            onSave={(time) => onChange('time', time)}
          />
        </View>
      </View>
    </FieldCard>
  );
}
