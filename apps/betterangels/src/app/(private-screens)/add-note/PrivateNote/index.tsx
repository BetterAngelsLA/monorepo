import {
  BasicTextarea,
  FieldCard,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';

interface IPrivateNoteProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
}

export default function PrivateNote(props: IPrivateNoteProps) {
  const { expanded, setExpanded } = props;
  const [value, setValue] = useState<string>('');
  const isPrivateNote = expanded === 'Private Note';

  return (
    <FieldCard
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
