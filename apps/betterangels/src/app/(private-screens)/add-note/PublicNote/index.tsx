import { useUpdateNoteMutation } from '@monorepo/expo/betterangels';
import {
  BasicTextarea,
  FieldCard,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { RefObject, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import InfoModal from './InfoModal';

interface IPublicNoteProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  isPublicNoteEdited: boolean;
  setIsPublicNoteEdited: (isPublicNoteEdited: boolean) => void;
  note: string;
  noteId: string;
  scrollRef: RefObject<ScrollView>;
}

export default function PublicNote(props: IPublicNoteProps) {
  const { expanded, setExpanded, note, noteId, scrollRef } = props;
  const [publicNote, setPublicNote] = useState<string>(note || '');
  const [hasError, setHasError] = useState(false);
  const [updateNote, { error }] = useUpdateNoteMutation();

  const isPublicNote = expanded === 'Public Note';

  const updateNoteFunction = useRef(
    debounce(async (value: string) => {
      if (!noteId || !value) return;

      try {
        const { data } = await updateNote({
          variables: {
            data: {
              id: noteId,
              publicDetails: value,
            },
          },
        });

        if (!data) {
          console.error(`Failed to update note: ${error}`);
        }
      } catch (err) {
        console.log(err);
      }
    }, 500)
  ).current;

  const onChange = (value: string) => {
    if (!value) {
      setHasError(true);
    } else {
      setHasError(false);
    }

    setPublicNote(value);
    updateNoteFunction(value);
  };

  return (
    <FieldCard
      scrollRef={scrollRef}
      error={hasError ? 'Please enter the public note' : undefined}
      expanded={expanded}
      mb="xs"
      setExpanded={() => setExpanded(isPublicNote ? null : 'Public Note')}
      title="Public Note"
      info={<InfoModal />}
      actionName={
        !isPublicNote && !publicNote ? (
          <TextMedium size="sm">Add HMIS note</TextMedium>
        ) : null
      }
    >
      {isPublicNote ? (
        <BasicTextarea
          error={hasError}
          value={publicNote}
          onChangeText={(text) => onChange(text)}
        />
      ) : (
        publicNote && <TextRegular mb="md">{publicNote}</TextRegular>
      )}
    </FieldCard>
  );
}
