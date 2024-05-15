import {
  BasicTextarea,
  FieldCard,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { RefObject, useState } from 'react';
import { ScrollView } from 'react-native';

interface IPrivateNoteProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function PrivateNote(props: IPrivateNoteProps) {
  const { expanded, setExpanded, scrollRef } = props;
  const [value, setValue] = useState<string>('');
  const isPrivateNote = expanded === 'Private Note';

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      mb="xs"
      setExpanded={() => setExpanded(isPrivateNote ? null : 'Private Note')}
      title="Private Note (Optional)"
      actionName={
        !value && !isPrivateNote ? (
          <TextMedium size="sm">Add private note</TextMedium>
        ) : null
      }
    >
      {isPrivateNote ? (
        <BasicTextarea
          mb="md"
          value={value}
          onChangeText={(e) => setValue(e)}
        />
      ) : (
        value && <TextRegular mb="md">{value}</TextRegular>
      )}
    </FieldCard>
  );
}
