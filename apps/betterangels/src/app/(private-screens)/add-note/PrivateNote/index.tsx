import {
  BodyText,
  FieldCard,
  H5,
  Textarea,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';

interface IPrivateNoteProps {
  expanded: string | undefined;
  setExpanded: (e: string | undefined) => void;
}

export default function PrivateNote(props: IPrivateNoteProps) {
  const { expanded, setExpanded } = props;
  const { control, watch } = useFormContext();

  const privateNote = watch('privateNote');
  const isPrivateNote = expanded === 'Private Note';

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() =>
        setExpanded(isPrivateNote ? undefined : 'Private Note')
      }
      title="Private Note (Optional)"
      actionName={
        !privateNote && !isPrivateNote ? (
          <H5 size="sm">Add private note</H5>
        ) : null
      }
    >
      {isPrivateNote ? (
        <Textarea mb="md" name="privateNote" control={control} />
      ) : (
        privateNote && <BodyText mb="md">{privateNote}</BodyText>
      )}
    </FieldCard>
  );
}
