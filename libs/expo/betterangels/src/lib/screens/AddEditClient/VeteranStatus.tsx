import { Spacings } from '@monorepo/expo/shared/static';
import {
  BasicRadio,
  FieldCard,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
  YesNoPreferNotToSayEnum,
} from '../../apollo';
import { enumDisplayVeteran } from '../../static/enumDisplayMaping';

interface IVeteranStatusProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function VeteranStatus(props: IVeteranStatusProps) {
  const { expanded, setExpanded, scrollRef } = props;
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const veteranStatus = watch('veteranStatus');

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
        !veteranStatus && !isVeteranStatus ? (
          <TextMedium size="sm">Add Veteran Status</TextMedium>
        ) : (
          <TextMedium size="sm">
            {veteranStatus && enumDisplayVeteran[veteranStatus]}
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
          {Object.entries(enumDisplayVeteran).map(
            ([enumValue, displayValue]) => (
              <BasicRadio
                label={displayValue}
                accessibilityHint={`Select ${displayValue}`}
                key={enumValue}
                value={veteranStatus && enumDisplayVeteran[veteranStatus]}
                onPress={() =>
                  setValue(
                    'veteranStatus',
                    enumValue as YesNoPreferNotToSayEnum
                  )
                }
              />
            )
          )}
        </View>
      </View>
    </FieldCard>
  );
}
