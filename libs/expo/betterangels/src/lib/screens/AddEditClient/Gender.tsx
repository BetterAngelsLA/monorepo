import { Spacings } from '@monorepo/expo/shared/static';
import {
  BasicRadio,
  FieldCard,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  GenderEnum,
  UpdateClientProfileInput,
} from '../../apollo';

interface IGenderProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

const GENDERS: Array<'Male' | 'Female' | 'Other'> = ['Male', 'Female', 'Other'];

export default function Gender(props: IGenderProps) {
  const { expanded, setExpanded, scrollRef } = props;
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const gender = watch('gender');

  const isGender = expanded === 'Gender';

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isGender ? null : 'Gender');
      }}
      mb="xs"
      actionName={
        !gender && !isGender ? (
          <TextMedium size="sm">Add Gender</TextMedium>
        ) : (
          <TextMedium textTransform="capitalize" size="sm">
            {gender}
          </TextMedium>
        )
      }
      title="Gender"
    >
      <View
        style={{
          gap: Spacings.sm,
          height: isGender ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacings.sm,
          }}
        >
          {GENDERS.map((q) => (
            <BasicRadio
              label={q}
              accessibilityHint={`Select ${q}`}
              key={q}
              value={gender}
              onPress={() => setValue('gender', GenderEnum[q])}
            />
          ))}
        </View>
      </View>
    </FieldCard>
  );
}
