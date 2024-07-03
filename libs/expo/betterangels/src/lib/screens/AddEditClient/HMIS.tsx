import { Spacings } from '@monorepo/expo/shared/static';
import {
  FieldCard,
  Input,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../apollo';

interface IHMISProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function HMIS(props: IHMISProps) {
  const { expanded, setExpanded, scrollRef } = props;
  const { control, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const isHMIS = expanded === 'HMIS ID#';
  const hmisId = watch('hmisId');

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isHMIS ? null : 'HMIS ID#');
      }}
      mb="xs"
      actionName={
        !hmisId && !isHMIS ? (
          <TextMedium size="sm">Add HMIS ID#</TextMedium>
        ) : (
          <TextMedium size="sm">{hmisId}</TextMedium>
        )
      }
      title="HMIS ID#"
    >
      <View
        style={{
          gap: Spacings.sm,
          height: isHMIS ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <Input control={control} name="hmisId" placeholder="Enter HMIS ID#" />
      </View>
    </FieldCard>
  );
}
