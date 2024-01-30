import {
  BodyText,
  FieldCard,
  H5,
  Textarea,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import InfoModal from './InfoModal';

interface IPublicNoteProps {
  expanded: string | undefined;
  setExpanded: (e: string | undefined) => void;
  firstName: string;
  isPublicNoteEdited: boolean;
  setIsPublicNoteEdited: (e: boolean) => void;
}

export default function PublicNote(props: IPublicNoteProps) {
  const {
    expanded,
    setExpanded,
    firstName,
    setIsPublicNoteEdited,
    isPublicNoteEdited,
  } = props;
  const { control, watch } = useFormContext();

  const hmisNote = watch('hmisNote');
  const isEmptyOrTemplate = !hmisNote || hmisNote === 'G: \nI: \nR: \nP: ';
  const isPublicNote = expanded === 'Public Note';
  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => setExpanded(isPublicNote ? undefined : 'Public Note')}
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
          name="hmisNote"
          control={control}
          label={`How was ${firstName} today`}
        />
      ) : (
        !isEmptyOrTemplate && <BodyText mb="md">{hmisNote}</BodyText>
      )}
    </FieldCard>
  );
}
