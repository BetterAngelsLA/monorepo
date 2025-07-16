import { useMutation } from '@apollo/client';
import {
  UPDATE_NOTE,
  UpdateNoteMutation,
  UpdateNoteMutationVariables,
} from '@monorepo/expo/betterangels';
import {
  DatePicker,
  FieldCard,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { format, setHours, setMinutes } from 'date-fns';
import { RefObject, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

interface IDateAndTimeProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  scrollRef: RefObject<ScrollView | null>;
  interactedAt: Date;
  noteId: string | undefined;
}

type TDateAndTime = {
  date: Date;
  time: Date;
};

const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

export default function DateAndTime(props: IDateAndTimeProps) {
  const { expanded, setExpanded, scrollRef, interactedAt, noteId } = props;

  const [updateNote] = useMutation<
    UpdateNoteMutation,
    UpdateNoteMutationVariables
  >(UPDATE_NOTE);

  const [dateTime, setDateTime] = useState<TDateAndTime>({
    date: interactedAt,
    time: interactedAt,
  });

  const noteRef = useRef(dateTime);
  const isDateAndTime = expanded === 'Date and Time';

  const updateNoteFunction = useRef(
    debounce(async (key: 'time' | 'date', value: string | Date | undefined) => {
      if (!noteId || !value) return;
      const currentNote = noteRef.current;
      const dateValue = key === 'date' ? value : new Date(currentNote.date);
      const timeValue = key === 'time' ? value : new Date(currentNote.time);
      let updatingField = value;

      if (timeValue instanceof Date && dateValue instanceof Date) {
        const hours = timeValue.getHours();
        const minutes = timeValue.getMinutes();
        const combinedDateTime = setMinutes(
          setHours(dateValue, hours),
          minutes
        );

        updatingField = new Date(combinedDateTime).toISOString();
      } else {
        throw new Error('Both timeValue and dateValue should be Date objects');
      }

      try {
        await updateNote({
          variables: {
            data: {
              id: noteId,
              interactedAt: updatingField,
            },
          },
        });
      } catch (err) {
        console.error(err);
      }
    }, 500)
  ).current;

  const onChange = (key: 'date' | 'time', value: Date | undefined) => {
    setDateTime({ ...dateTime, [key]: value });
    updateNoteFunction(key, value);
  };

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      mb="xs"
      setExpanded={() => setExpanded(isDateAndTime ? null : 'Date and Time')}
      title="Date and Time"
      actionName={
        !dateTime.date && !isDateAndTime ? (
          <TextMedium size="sm">Add Date and Time</TextMedium>
        ) : dateTime.date && !isDateAndTime ? (
          <TextMedium size="sm">
            {dateTime.date ? format(dateTime.date, 'MM/dd/yyyy') : ''}{' '}
            {dateTime.time ? format(dateTime.time, 'h:mm a') : ''}
          </TextMedium>
        ) : null
      }
    >
      <View
        style={{
          height: isDateAndTime ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <DatePicker
          type="numeric"
          validRange={{
            endDate: endOfDay,
            startDate: new Date('1900-01-01'),
          }}
          value={new Date(dateTime.date) || new Date()}
          onChange={(date) => onChange('date', date)}
        />
        <DatePicker
          type="wheel"
          required
          maxDate={endOfDay}
          mode="time"
          format="h:mm a"
          placeholder="h:mm a"
          mt="xs"
          mb="sm"
          value={new Date(dateTime.time) || new Date()}
          onChange={(time) => onChange('time', time)}
        />
      </View>
    </FieldCard>
  );
}
