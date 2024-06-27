import { Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  FieldCard,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { UpdateClientProfileInput } from '../../apollo';

interface IHMISProps {
  client: UpdateClientProfileInput | undefined;
  setClient: (client: UpdateClientProfileInput | undefined) => void;
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function HMIS(props: IHMISProps) {
  const { expanded, setExpanded, client, setClient, scrollRef } = props;

  const isHMIS = expanded === 'HMIS ID#';
  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isHMIS ? null : 'HMIS ID#');
      }}
      mb="xs"
      actionName={
        !client?.hmisId && !isHMIS ? (
          <TextMedium size="sm">Add HMIS ID#</TextMedium>
        ) : (
          <TextMedium size="sm">{client?.hmisId}</TextMedium>
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
        <BasicInput
          value={client?.hmisId || ''}
          onDelete={() => client && setClient({ ...client, hmisId: '' })}
          onChangeText={(e) => client && setClient({ ...client, hmisId: e })}
          placeholder="Enter HMIS ID#"
        />
      </View>
    </FieldCard>
  );
}
