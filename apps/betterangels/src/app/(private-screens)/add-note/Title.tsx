import { SolidPeincilIcon } from '@monorepo/expo/shared/icons';
import { Colors, Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  BodyText,
  DatePicker,
  H5,
  IconButton,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
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
  const [note, setNote] = useState<TNote>({
    title: noteTitle,
    date: formattedDate,
  });
  const [errors, setErrors] = useState({
    title: false,
    noteDate: false,
    noteTime: false,
  });
  const isTitle = expanded === 'Title';

  useEffect(() => {
    console.log(noteId);
    console.log(setErrors);
  }, [expanded]);

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
              color={errors.title ? Colors.ERROR : Colors.PRIMARY_EXTRA_DARK}
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
          error={!!errors.title}
          value={note.title}
          onChangeText={(e) => setNote({ ...note, title: e })}
        />
        <DatePicker
          error={!!errors.noteDate}
          required
          disabled
          pattern={Regex.date}
          maxDate={endOfDay}
          mode="date"
          format="MM/dd/yyyy"
          placeholder="MM/DD/YYYY"
          mt="xs"
          onSave={(date) => setNote({ ...note, date })}
        />
        <DatePicker
          error={!!errors.noteTime}
          disabled
          required
          maxDate={endOfDay}
          mode="time"
          format="HH:mm"
          placeholder="HH:MM"
          mt="xs"
          onSave={(time) => setNote({ ...note, time })}
        />
      </View>
    </View>
  );
}
