import {
  BodyText,
  FieldCard,
  H5,
  Textarea,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import InfoModal from './InfoModal';

interface IPublicNoteProps {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
  isPublicNoteEdited: boolean | null;
  setIsPublicNoteEdited: (e: boolean) => void;
}

export default function PublicNote(props: IPublicNoteProps) {
  const { expanded, setExpanded, setIsPublicNoteEdited, isPublicNoteEdited } =
    props;
  const { control, watch } = useFormContext();

  const publicDetails = watch('publicDetails');
  const isEmptyOrTemplate =
    !publicDetails || publicDetails === 'G -\nI -\nR -\nP - ';
  const isPublicNote = expanded === 'Public Note';

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => setExpanded(isPublicNote ? null : 'Public Note')}
      title="Public Note"
      info={<InfoModal />}
      actionName={
        isEmptyOrTemplate && !isPublicNote ? (
          <H5 size="sm">Add HMIS note</H5>
        ) : null
      }
    >
      {isPublicNote ? (
        <Textarea
          textAreaChanged={isPublicNoteEdited}
          setTextAreaChanged={setIsPublicNoteEdited}
          mb="md"
          name="publicDetails"
          control={control}
        />
      ) : (
        !isEmptyOrTemplate && <BodyText mb="md">{publicDetails}</BodyText>
      )}
    </FieldCard>
  );
}
