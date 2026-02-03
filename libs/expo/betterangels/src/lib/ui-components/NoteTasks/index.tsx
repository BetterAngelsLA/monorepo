import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CTAButton,
  FieldCard,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { SelahTeamEnum, UpdateTaskInput, ViewNoteQuery } from '../../apollo';
import { useModalScreen } from '../../providers';
import NoteTasksModal from './NoteTaskModal';

interface INoteTasksProps {
  clientProfileId: string;
  noteId: string;
  scrollRef: RefObject<ScrollView | null>;
  tasks?: ViewNoteQuery['note']['tasks'];
  refetch: () => void;
  team?: SelahTeamEnum | null;
}

export default function NoteTasks(props: INoteTasksProps) {
  const { clientProfileId, noteId, tasks, scrollRef, refetch, team } = props;
  const { showModalScreen } = useModalScreen();

  if (!tasks) {
    return null;
  }

  const onCTAPress = (task: UpdateTaskInput) => {
    showModalScreen({
      presentation: 'fullScreenModal',
      hideHeader: true,
      content: (
        <NoteTasksModal
          clientProfileId={clientProfileId}
          task={task}
          team={team}
          noteId={noteId}
          refetch={refetch}
        />
      ),
    });
  };

  return (
    <FieldCard
      scrollRef={scrollRef}
      mb="xs"
      actionName=""
      title="Follow-Up Tasks"
      setExpanded={() => {
        !tasks.length &&
          showModalScreen({
            presentation: 'fullScreenModal',
            hideHeader: true,
            content: (
              <NoteTasksModal
                clientProfileId={clientProfileId}
                team={team}
                noteId={noteId}
                refetch={refetch}
              />
            ),
          });
      }}
    >
      {!!tasks.length && (
        <>
          <View
            style={{
              gap: Spacings.xs,
            }}
          >
            {tasks.map((item, index) => {
              return (
                <CTAButton
                  onPress={() => onCTAPress(item)}
                  key={index}
                  label={item.summary || ''}
                />
              );
            })}
          </View>
          <View
            style={{ paddingVertical: Spacings.md, alignItems: 'flex-start' }}
          >
            <TextButton
              onPress={() =>
                showModalScreen({
                  presentation: 'fullScreenModal',
                  hideHeader: true,
                  content: (
                    <NoteTasksModal
                      clientProfileId={clientProfileId}
                      team={team}
                      noteId={noteId}
                      refetch={refetch}
                    />
                  ),
                })
              }
              fontSize="sm"
              title="Add Another Task"
              color={Colors.PRIMARY}
              accessibilityHint="Adds another task to the note"
            />
          </View>
        </>
      )}
    </FieldCard>
  );
}
