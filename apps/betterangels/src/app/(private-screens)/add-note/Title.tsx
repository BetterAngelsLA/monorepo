import { useMutation } from '@apollo/client';
import {
  UPDATE_NOTE,
  UpdateNoteMutation,
  UpdateNoteMutationVariables,
} from '@monorepo/expo/betterangels';
import { Colors, Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  DatePicker,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { format, parse, setHours, setMinutes } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

interface ITitleProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  noteTitle?: string;
  noteId: string | undefined;
  noteDate: Date;
  errors: {
    title: boolean;
    location: boolean;
    date: boolean;
    time: boolean;
  };
  setErrors: (errors: {
    title: boolean;
    location: boolean;
    date: boolean;
    time: boolean;
  }) => void;
}

type TNote = {
  title: string | undefined;
  date: string;
  time: string;
};

const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

export default function Title(props: ITitleProps) {
  const {
    noteTitle,
    expanded,
    setExpanded,
    noteId,
    noteDate,
    errors,
    setErrors,
  } = props;
  const [updateNote] = useMutation<
    UpdateNoteMutation,
    UpdateNoteMutationVariables
  >(UPDATE_NOTE);
  const [note, setNote] = useState<TNote>({
    title: noteTitle,
    date: format(noteDate, 'MM/dd/yyyy'),
    time: format(noteDate, 'HH:mm'),
  });

  const noteRef = useRef(note);
  const isTitle = expanded === 'Title';

  const updateNoteFunction = useRef(
    debounce(async (key: 'time' | 'title' | 'date', value: string) => {
      if (!noteId || !value) return;
      const currentNote = noteRef.current;
      const dateValue = key === 'date' ? value : currentNote.date;
      const timeValue = key === 'time' ? value : currentNote.time;
      let updatingField = value;

      const updatingKey = key === 'title' ? 'title' : 'interactedAt';
      if (key === 'time' || key === 'date') {
        const parsedDate = parse(dateValue, 'MM/dd/yyyy', new Date());
        const [hours, minutes] = timeValue.split(':').map(Number);
        const combinedDateTime = setMinutes(
          setHours(parsedDate, hours),
          minutes
        );

        updatingField = new Date(combinedDateTime).toISOString();
      }

      try {
        await updateNote({
          variables: {
            data: {
              id: noteId,
              [updatingKey]: updatingField,
            },
          },
        });
      } catch (err) {
        console.log(err);
      }
    }, 500)
  ).current;

  const onChange = (key: 'title' | 'date' | 'time', value: string) => {
    if (!value) {
      setErrors({ ...errors, [key]: true });
    }
    if (errors[key]) {
      setErrors({ ...errors, [key]: false });
    }
    setNote({ ...note, [key]: value });
    updateNoteFunction(key, value);
  };

  useEffect(() => {
    noteRef.current = note;
  }, [note]);

  return (
    <View style={{ marginBottom: Spacings.xs }}>
      <View
        style={{
          height: !isTitle ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={() => setExpanded('Title')}
          accessibilityRole="button"
          accessibilityHint="opens title edit"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {(errors.title || errors.date || errors.time) && (
            <TextRegular color={Colors.ERROR}>
              These fields are required
            </TextRegular>
          )}
          <TextMedium mr="sm">
            {note.title} <TextRegular color={Colors.ERROR}>*</TextRegular>
          </TextMedium>
        </Pressable>
        <TextRegular size="xs" mb="md">
          {note.date} {note?.time || ''}
        </TextRegular>
      </View>
      <View
        style={{
          height: isTitle ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <BasicInput
          onDelete={() => {
            setNote({ ...note, title: '' });
            setErrors({ ...errors, title: true });
          }}
          error={!!errors.title}
          value={note.title}
          onChangeText={(e) => onChange('title', e)}
        />
        <DatePicker
          error={!!errors.date}
          required
          disabled
          initialDate={noteDate}
          pattern={Regex.date}
          maxDate={endOfDay}
          mode="date"
          format="MM/dd/yyyy"
          placeholder="MM/DD/YYYY"
          mt="xs"
          onSave={(date) => onChange('date', date)}
        />
        <DatePicker
          error={!!errors.time}
          disabled
          required
          maxDate={endOfDay}
          initialDate={noteDate}
          mode="time"
          format="HH:mm"
          placeholder="HH:MM"
          mt="xs"
          onSave={(time) => onChange('time', time)}
        />
      </View>
    </View>
  );
}
