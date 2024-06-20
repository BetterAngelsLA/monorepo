import { Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  DatePicker,
  FieldCard,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { CreateClientProfileInput } from '../../apollo';

interface IDobProps {
  client: CreateClientProfileInput;
  setClient: (client: CreateClientProfileInput) => void;
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
}

export default function Dob(props: IDobProps) {
  const { expanded, setExpanded, client, setClient } = props;
  const isDob = expanded === 'Date of Birth';
  return (
    <FieldCard
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isDob ? null : 'Date of Birth');
      }}
      mb="xs"
      actionName={
        !client.dateOfBirth && !isDob ? (
          <TextMedium size="sm">Add DoB</TextMedium>
        ) : (
          <TextMedium size="sm">{client.dateOfBirth}</TextMedium>
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
          initialDate={new Date()}
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
