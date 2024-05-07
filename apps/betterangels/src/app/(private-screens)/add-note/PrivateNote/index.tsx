import {
  FieldCard,
  TextMedium,
  TextRegular,
  Textarea,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { useFormContext } from 'react-hook-form';
import { ScrollView } from 'react-native';

interface IPrivateNoteProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function PrivateNote(props: IPrivateNoteProps) {
  const { expanded, setExpanded, scrollRef } = props;
  const { control, watch } = useFormContext();

  const privateNote = watch('privateNote');
  const isPrivateNote = expanded === 'Private Note';

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      mb="xs"
      setExpanded={() => setExpanded(isPrivateNote ? null : 'Private Note')}
      title="Private Note (Optional)"
      actionName={
        !privateNote && !isPrivateNote ? (
          <TextMedium size="sm">Add private note</TextMedium>
        ) : null
      }
    >
      {isPrivateNote ? (
        <Textarea mb="md" name="privateNote" control={control} />
      ) : (
        privateNote && <TextRegular mb="md">{privateNote}</TextRegular>
      )}
    </FieldCard>
  );
}
