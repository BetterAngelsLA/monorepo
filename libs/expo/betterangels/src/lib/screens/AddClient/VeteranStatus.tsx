import { Spacings } from '@monorepo/expo/shared/static';
import {
  BasicRadio,
  FieldCard,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  YesNoPreferNotToSayEnum,
} from '../../apollo';

interface IVeteranStatusProps {
  client: CreateClientProfileInput;
  setClient: (client: CreateClientProfileInput) => void;
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function VeteranStatus(props: IVeteranStatusProps) {
  const { expanded, setExpanded, client, scrollRef, setClient } = props;

  const enumDisplayMap: { [key in YesNoPreferNotToSayEnum]: string } = {
    [YesNoPreferNotToSayEnum.Yes]: 'Yes',
    [YesNoPreferNotToSayEnum.No]: 'No',
    [YesNoPreferNotToSayEnum.PreferNotToSay]: 'Prefer not to say',
  };
  const isVeteranStatus = expanded === 'Veteran Status';

  // function doTheThing(enumValue: string) {
  //   setClient({
  //     ...client,
  //     veteranStatus: enumValue as YesNoPreferNotToSayEnum,
  //   });
  //   console.log('client', client.veteranStatus);
  //   console.log('enumValue', enumValue);
  // }
  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isVeteranStatus ? null : 'Veteran Status');
      }}
      mb="xs"
      actionName={
        !client.veteranStatus && !isVeteranStatus ? (
          <TextMedium size="sm">Add Veteran Status</TextMedium>
        ) : (
          <TextMedium size="sm">
            {enumDisplayMap[client.veteranStatus]}
          </TextMedium>
        )
      }
      title="Veteran Status"
    >
      <View
        style={{
          gap: Spacings.sm,
          height: isVeteranStatus ? 'auto' : 0,
          overflow: 'hidden',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <TextRegular>Are you a veteran?</TextRegular>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: Spacings.sm,
            flex: 1,
          }}
        >
          {Object.entries(enumDisplayMap).map(([enumValue, displayValue]) => (
            <BasicRadio
              label={displayValue}
              accessibilityHint={`Select ${displayValue}`}
              key={enumValue}
              value={client.veteranStatus}
              onPress={() =>
                setClient({
                  ...client,
                  veteranStatus: enumValue as YesNoPreferNotToSayEnum,
                })
              }
              // onPress={() => doTheThing(enumValue)}
            />
          ))}
        </View>
      </View>
    </FieldCard>
  );
}
