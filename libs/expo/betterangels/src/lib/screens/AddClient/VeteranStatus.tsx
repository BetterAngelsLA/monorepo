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

const VETERAN_STATUS: Array<'Yes' | 'No' | 'Prefer Not To Say'> = [
  'Yes',
  'No',
  'Prefer Not To Say',
];

export default function VeteranStatus(props: IVeteranStatusProps) {
  const { expanded, setExpanded, client, scrollRef, setClient } = props;

  const isVeteranStatus = expanded === 'Veteran Status';
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
          <TextMedium size="sm">{client.veteranStatus}</TextMedium>
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
            gap: Spacings.sm,
          }}
        >
          {VETERAN_STATUS.map((q) => (
            <BasicRadio
              label={q}
              accessibilityHint={`Select ${q}`}
              key={q}
              value={client.veteranStatus}
              onPress={() =>
                setClient({
                  ...client,
                  veteranStatus:
                    YesNoPreferNotToSayEnum[
                      q.trim() as 'Yes' | 'No' | 'PreferNotToSay'
                    ],
                })
              }
            />
          ))}
        </View>
      </View>
    </FieldCard>
  );
}
