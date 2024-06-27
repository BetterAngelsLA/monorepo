import { Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  DatePicker,
  FieldCard,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { UpdateClientProfileInput } from '../../apollo';

interface IDobProps {
  client: UpdateClientProfileInput | undefined;
  setClient: (client: UpdateClientProfileInput | undefined) => void;
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
  initialDate: Date | undefined;
}

export default function Dob(props: IDobProps) {
  const { expanded, setExpanded, client, setClient, scrollRef, initialDate } =
    props;
  const isDob = expanded === 'Date of Birth';

  if (!client) return;

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isDob ? null : 'Date of Birth');
      }}
      mb="xs"
      actionName={
        !client?.dateOfBirth && !isDob ? (
          <TextMedium size="sm">Add DoB</TextMedium>
        ) : (
          <TextMedium size="sm">{client?.dateOfBirth}</TextMedium>
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
          initialDate={initialDate}
          pattern={Regex.date}
          mode="date"
          format="MM/dd/yyyy"
          placeholder="MM/DD/YYYY"
          mt="xs"
          onSave={(date) =>
            setClient({
              ...client,
              dateOfBirth: date,
            })
          }
        />
      </View>
    </FieldCard>
  );
}
