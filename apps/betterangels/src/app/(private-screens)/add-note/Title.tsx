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
  BodyText,
  DatePicker,
  H5,
  IconButton,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { format } from 'date-fns';
import { useRef, useState } from 'react';
import { View } from 'react-native';

interface ITitleProps {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
  noteTitle?: string;
  noteId: string | undefined;
}

type TNote = {
  title: string | undefined;
  date: string;
  time?: string | undefined;
};

const formattedDate = format(new Date(), 'MM/dd/yyyy');

const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

export default function Title(props: ITitleProps) {
  const { noteTitle, expanded, setExpanded, noteId } = props;
  const [updateNote] = useMutation<
    UpdateNoteMutation,
    UpdateNoteMutationVariables
  >(UPDATE_NOTE);
  const [note, setNote] = useState<TNote>({
    title: noteTitle,
    date: formattedDate,
    time: '',
  });

  const [error, setError] = useState({
    title: false,
    date: false,
    time: false,
  });
  const isTitle = expanded === 'Title';

  const updateNoteFunction = useRef(
    debounce(async (key: string, value: string) => {
      if (!noteId || !value) return;
      try {
        await updateNote({
          variables: {
            data: {
              id: noteId,
              [key]: value,
            },
          },
        });
      } catch (e) {
        console.log(e);
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
          <H5 mr="sm">{note.title}</H5>
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
        <BodyText size="xs" mb="md">
          {note.date} {note?.time || ''}
        </BodyText>
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
