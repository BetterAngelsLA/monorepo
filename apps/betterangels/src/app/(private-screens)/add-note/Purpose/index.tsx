import {
  BasicInput,
  FieldCard,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';

interface IPurposeProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  scrollRef: RefObject<ScrollView | null>;
  purpose: string | null | undefined;
  onPurposeChange: (value: string | null | undefined) => void;
}

export default function Purpose(props: IPurposeProps) {
  const { expanded, setExpanded, scrollRef, purpose, onPurposeChange } = props;

  const isPurpose = expanded === 'Purpose';

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      mb="xs"
      setExpanded={() => setExpanded(isPurpose ? null : 'Purpose')}
      title="Purpose"
      actionName={
        !purpose && !isPurpose ? (
          <TextMedium size="sm">Add Purpose</TextMedium>
        ) : null
      }
    >
      <View
        style={{
          height: isPurpose ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <BasicInput
          placeholder="Enter purpose"
          maxLength={100}
          onDelete={() => onPurposeChange(null)}
          value={purpose || undefined}
          onChangeText={(e) => onPurposeChange(e)}
        />
      </View>
      {purpose && !isPurpose && <TextRegular mb="md">{purpose}</TextRegular>}
    </FieldCard>
  );
}
