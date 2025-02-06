import { FieldCard, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { RefObject } from 'react';
import { ScrollView } from 'react-native';

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
  const { expanded, note, noteId, scrollRef } = props;
  const router = useRouter();

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      mb="xs"
      setExpanded={() =>
        router.navigate({
          pathname: '/public-note',
          params: {
            id: noteId,
          },
        })
      }
      title="Note"
      actionName={null}
    >
      {note && <TextRegular mb="md">{note}</TextRegular>}
    </FieldCard>
  );
}
