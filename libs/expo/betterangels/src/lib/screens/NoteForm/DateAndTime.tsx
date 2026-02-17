import {
  DatePicker,
  FieldCard,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { format, isValid, setHours, setMinutes } from 'date-fns';
import { RefObject, useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

interface IDateAndTimeProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  scrollRef: RefObject<ScrollView | null>;
  interactedAt: Date | string | null | undefined;
  onInteractedAtChange: (value: string | null | undefined) => void;
}

type TDateAndTime = {
  date: Date | undefined;
  time: Date | undefined;
};

const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

export default function DateAndTime(props: IDateAndTimeProps) {
  const {
    expanded,
    setExpanded,
    scrollRef,
    interactedAt,
    onInteractedAtChange,
  } = props;

  // Convert interactedAt to Date object if it's a string
  const parseInteractedAt = (
    value: Date | string | null | undefined
  ): Date | undefined => {
    if (!value) {
      return undefined;
    }
    if (value instanceof Date) {
      return isValid(value) ? value : undefined;
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      return isValid(date) ? date : undefined;
    }
    return undefined;
  };

  const initialDate = parseInteractedAt(interactedAt);

  const [dateTime, setDateTime] = useState<TDateAndTime>({
    date: initialDate,
    time: initialDate,
  });

  const noteRef = useRef(dateTime);
  const isDateAndTime = expanded === 'Date and Time';

  // Sync state with interactedAt prop when it changes (e.g., after save)
  useEffect(() => {
    const parsedDate = parseInteractedAt(interactedAt);
    if (parsedDate) {
      const updatedDateTime = {
        date: parsedDate,
        time: parsedDate,
      };
      setDateTime(updatedDateTime);
      noteRef.current = updatedDateTime;
    } else if (interactedAt === null || interactedAt === undefined) {
      // If explicitly cleared, update state to undefined
      const updatedDateTime = {
        date: undefined,
        time: undefined,
      };
      setDateTime(updatedDateTime);
      noteRef.current = updatedDateTime;
    }
  }, [interactedAt]);

  const computeInteractedAt = (
    key: 'time' | 'date',
    value: Date | null | undefined
  ): string | null | undefined => {
    const currentNote = noteRef.current;

    if (value === null || value === undefined) {
      if (key === 'date') {
        return null;
      } else if (key === 'time') {
        if (currentNote.date && isValid(currentNote.date)) {
          const dateWithStartTime = setMinutes(
            setHours(new Date(currentNote.date), 0),
            0
          );
          return dateWithStartTime.toISOString();
        } else {
          return undefined;
        }
      }
    } else {
      let dateValue: Date = new Date();
      if (key === 'date' && value instanceof Date) {
        dateValue = value;
      } else if (currentNote.date) {
        dateValue = new Date(currentNote.date);
      }

      let timeValue: Date = new Date();
      if (key === 'time' && value instanceof Date) {
        timeValue = value;
      } else if (currentNote.time) {
        timeValue = new Date(currentNote.time);
      }

      if (isValid(timeValue) && isValid(dateValue)) {
        const hours = timeValue.getHours();
        const minutes = timeValue.getMinutes();
        const combinedDateTime = setMinutes(
          setHours(dateValue, hours),
          minutes
        );
        return combinedDateTime.toISOString();
      }
    }
    return undefined;
  };

  const onChange = (key: 'date' | 'time', value: Date | null | undefined) => {
    const updatedDateTime = { ...dateTime, [key]: value };
    setDateTime(updatedDateTime);
    noteRef.current = updatedDateTime;

    const computedValue = computeInteractedAt(key, value);
    onInteractedAtChange(computedValue);
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
          placeholder="Enter date"
          validRange={{
            endDate: endOfDay,
            startDate: new Date('1900-01-01'),
          }}
          value={
            dateTime.date && isValid(dateTime.date) ? dateTime.date : undefined
          }
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
          value={
            dateTime.time && isValid(dateTime.time) ? dateTime.time : undefined
          }
          onChange={(time) => onChange('time', time)}
        />
      </View>
    </FieldCard>
  );
}
