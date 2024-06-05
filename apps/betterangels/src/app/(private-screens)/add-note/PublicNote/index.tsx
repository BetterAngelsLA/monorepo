import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  FieldCard,
  TextBold,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
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
      title="Public Note"
      info={<InfoModal />}
      actionName={
        !note ? (
          <TextMedium size="sm">Add HMIS note</TextMedium>
        ) : (
          <View
            style={{
              backgroundColor: Colors.WARNING_EXTRA_LIGHT,
              borderRadius: 8,
              padding: Spacings.xs,
            }}
          >
            <TextBold color={Colors.WARNING_DARK}>Review HMIS Note</TextBold>
          </View>
        )
      }
    >
      {note && <TextRegular mb="md">{note}</TextRegular>}
    </FieldCard>
  );
}
