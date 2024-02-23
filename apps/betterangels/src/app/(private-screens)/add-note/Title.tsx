import { SolidPeincilIcon } from '@monorepo/expo/shared/icons';
import { Colors, Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  DatePicker,
  H5,
  IconButton,
  Input,
} from '@monorepo/expo/shared/ui-components';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';

interface ITitleProps {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
  noteTitle: string;
}

const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

export default function Title(props: ITitleProps) {
  const { noteTitle, expanded, setExpanded } = props;
  const {
    setValue,
    control,
    watch,
    formState: { errors },
  } = useFormContext();
  const title = watch('title');
  const noteDate = watch('noteDate');
  const noteTime = watch('noteTime');
  const isTitle = expanded === 'Title';

  useEffect(() => {
    setValue('title', noteTitle);
  }, [noteTitle, setValue]);

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
          <H5 mr="sm">{title}</H5>
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
          {noteDate} {noteTime || ''}
        </BodyText>
      </View>
      <View
        style={{
          height: isTitle ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <Input
          error={!!errors.title}
          rules={{
            required: true,
            pattern: Regex.empty,
          }}
          control={control}
          name="title"
        />
        <DatePicker
          error={!!errors.noteDate}
          required
          pattern={Regex.date}
          maxDate={endOfDay}
          mode="date"
          format="MM/dd/yyyy"
          placeholder="MM/DD/YYYY"
          mt="xs"
          control={control}
          name="noteDate"
        />
        <DatePicker
          error={!!errors.noteTime}
          pattern={Regex.time}
          required
          maxDate={endOfDay}
          mode="time"
          format="HH:mm"
          placeholder="HH:MM"
          mt="xs"
          control={control}
          name="noteTime"
        />
      </View>
    </View>
  );
}
