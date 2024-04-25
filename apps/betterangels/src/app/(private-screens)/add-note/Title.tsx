import { useMutation } from '@apollo/client';
import {
  UPDATE_NOTE,
  UpdateNoteMutation,
  UpdateNoteMutationVariables,
} from '@monorepo/expo/betterangels';
import { SolidPeincilIcon } from '@monorepo/expo/shared/icons';
import { Colors, Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  DatePicker,
  TextMedium,
  IconButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { format, parse, setHours, setMinutes } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

interface ITitleProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  noteTitle?: string;
  noteId: string | undefined;
  noteDate: Date;
}

type TNote = {
  title: string | undefined;
  date: string;
  time: string;
};

const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

export default function Title(props: ITitleProps) {
  const { noteTitle, expanded, setExpanded, noteId, noteDate } = props;
  const [updateNote] = useMutation<
    UpdateNoteMutation,
    UpdateNoteMutationVariables
  >(UPDATE_NOTE);
  const [note, setNote] = useState<TNote>({
    title: noteTitle,
    date: format(noteDate, 'MM/dd/yyyy'),
    time: format(noteDate, 'HH:mm'),
  });

  const [error, setError] = useState({
    title: false,
    date: false,
    time: false,
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
      setError({ ...error, [key]: true });
    }
    if (error[key]) {
      setError({ ...error, [key]: false });
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TextMedium mr="sm">{note.title}</TextMedium>
          <IconButton
            onPress={() => setExpanded('Title')}
            accessibilityLabel="edit"
            accessibilityHint="edits note title"
            variant="transparent"
          >
            <SolidPeincilIcon
              size="lg"
              color={error.title ? Colors.ERROR : Colors.PRIMARY_EXTRA_DARK}
            />
          </IconButton>
        </View>
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
            setError({ ...error, title: true });
          }}
          error={!!error.title}
          value={note.title}
          onChangeText={(e) => onChange('title', e)}
        />
        <DatePicker
          error={!!error.date}
          required
          disabled
          pattern={Regex.date}
          maxDate={endOfDay}
          mode="date"
          format="MM/dd/yyyy"
          placeholder="MM/DD/YYYY"
          mt="xs"
          onSave={(date) => onChange('date', date)}
        />
        <DatePicker
          error={!!error.time}
          disabled
          required
          maxDate={endOfDay}
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
