import {
  BodyText,
  FieldCard,
  H5,
  Textarea,
} from '@monorepo/expo/shared/ui-components';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

interface IPrivateNoteProps {
  notePrivateDetails: string | undefined;
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
}

export default function PrivateNote(props: IPrivateNoteProps) {
  const { notePrivateDetails, expanded, setExpanded } = props;
  const { setValue, control, watch } = useFormContext();

  const privateDetails = watch('privateDetails');
  const isPrivateDetails = expanded === 'Private Note';

  useEffect(() => {
    setValue('privateDetails', notePrivateDetails);
  }, [notePrivateDetails, setValue]);

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => setExpanded(isPrivateDetails ? null : 'Private Note')}
      title="Private Note (Optional)"
      actionName={
        !privateDetails && !isPrivateDetails ? (
          <H5 size="sm">Add private note</H5>
        ) : null
      }
    >
      {isPrivateDetails ? (
        <Textarea mb="md" name="privateDetails" control={control} />
      ) : (
        privateDetails && <BodyText mb="md">{privateDetails}</BodyText>
      )}
    </FieldCard>
  );
}
