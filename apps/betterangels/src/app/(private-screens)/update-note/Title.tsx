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
  firstName: string;
}

const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

export default function Title(props: ITitleProps) {
  const { firstName, expanded, setExpanded } = props;
  const {
    setValue,
    control,
    watch,
    formState: { errors },
  } = useFormContext();
  const title = watch('title');
  const noteDateTime = watch('noteDateTime');
  const isTitle = expanded === 'Title';

  useEffect(() => {
    setValue('title', `Session with ${firstName}`);
  }, []);

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
          {noteDateTime}
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
          maxDate={endOfDay}
          mt="xs"
          control={control}
          name="noteDateTime"
        />
      </View>
    </View>
  );
}
