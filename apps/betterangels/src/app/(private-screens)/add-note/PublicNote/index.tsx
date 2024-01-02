import {
  BodyText,
  FieldCard,
  H5,
  Textarea,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';

interface IPublicNoteProps {
  expanded: string | undefined;
  setExpanded: (e: string | undefined) => void;
  firstName: string;
}

export default function PublicNote(props: IPublicNoteProps) {
  const { expanded, setExpanded, firstName } = props;
  const { control, watch } = useFormContext();

  const hmisNote = watch('hmisNote');
  const isEmptyOrTemplate =
    !hmisNote || hmisNote === 'G: \n\nI: \n\nR: \n\nP: \n';
  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() =>
        setExpanded(expanded === 'Public Note' ? undefined : 'Public Note')
      }
      title="Public Note"
      actionName={
        isEmptyOrTemplate && expanded !== 'Public Note' ? (
          <H5 size="sm">Add HMIS note</H5>
        ) : null
      }
    >
      {expanded === 'Public Note' ? (
        <Textarea
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
