import { Spacings } from '@monorepo/expo/shared/static';
import {
  BasicRadio,
  FieldCard,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { CreateClientProfileInput, GenderEnum } from '../../apollo';

interface IGenderProps {
  client: CreateClientProfileInput;
  setClient: (client: CreateClientProfileInput) => void;
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
}

const GENDERS: Array<'Male' | 'Female' | 'Nonbinary'> = [
  'Male',
  'Female',
  'Nonbinary',
];

export default function Gender(props: IGenderProps) {
  const { expanded, setExpanded, client, setClient } = props;

  const isGender = expanded === 'Gender';

  return (
    <FieldCard
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isGender ? null : 'Gender');
      }}
      mb="xs"
      actionName={
        !client.gender && !isGender ? (
          <TextMedium size="sm">Add Gender</TextMedium>
        ) : (
          <TextMedium size="sm">{client.gender}</TextMedium>
        )
      }
      title="Gender"
    >
      <View
        style={{
          gap: Spacings.sm,
          height: isGender ? 'auto' : 0,
          overflow: 'hidden',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {GENDERS.map((q) => (
          <BasicRadio
            label={q}
            accessibilityHint={`Select ${q}`}
            key={q}
            value={client.gender}
            onPress={() =>
              setClient({
                ...client,
                gender: q as GenderEnum,
              })
            }
          />
        ))}
      </View>
    </FieldCard>
  );
}
