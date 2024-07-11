import { Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  DatePicker,
  FieldCard,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { RefObject } from 'react';
import { useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../apollo';

interface IDobProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function Dob(props: IDobProps) {
  const { expanded, setExpanded, scrollRef } = props;

  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const dateOfBirth = watch('dateOfBirth');
  const isDob = expanded === 'Date of Birth';

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isDob ? null : 'Date of Birth');
      }}
      mb="xs"
      actionName={
        !dateOfBirth && !isDob ? (
          <TextMedium size="sm">Add DoB</TextMedium>
        ) : (
          <TextMedium size="sm">
            {dateOfBirth && format(dateOfBirth, 'MM/dd/yyyy')}
          </TextMedium>
        )
      }
      title="Date of Birth"
    >
      <View
        style={{
          gap: Spacings.sm,
          height: isDob ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <DatePicker
          disabled
          maxDate={new Date()}
          pattern={Regex.date}
          mode="date"
          format="MM/dd/yyyy"
          placeholder="MM/DD/YYYY"
          mt="xs"
          value={dateOfBirth || new Date()}
          setValue={(date) => setValue('dateOfBirth', date)}
        />
      </View>
    </FieldCard>
  );
}
